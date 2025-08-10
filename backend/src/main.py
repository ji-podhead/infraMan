from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fritzconnection import FritzConnection
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base # Angepasster Import
import paramiko
import os
import logging
from datetime import datetime
from typing import List, Dict, Optional, Set
from pydantic import BaseModel
import requests
import json
import shlex # Import shlex for proper shell quoting

# Logger Setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("backend-app")

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000", "http://10.0.0.107:3000"],  # Erlaubt alle Ursprünge, aber du kannst hier spezifische URLs angeben
    allow_origin_regex="https?://.*",  # Erlaubt alle HTTP/HTTPS Ursprünge
    max_age=3600,  # Caching der CORS-Preflight-Anfrage
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./test.db")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Fritz!Box Connection
def get_fritz_connection():
    return FritzConnection(
        address=os.environ["FRITZ_IP"],
        user=os.environ["FRITZ_USER"],
        password=os.environ["FRITZ_PASSWORD"]
    )

# Database Models
class Server(Base):
    __tablename__ = "servers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    ip_address = Column(String, unique=True)
    ssh_user = Column(String)
    ssh_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Pydantic Models
class ServerCreate(BaseModel):
    name: str
    ip_address: str
    ssh_user: str
    ssh_password: str

class ServerUpdate(BaseModel):
    name: str
    ip_address: str
    ssh_user: str
    ssh_password: str

class ServerResponse(BaseModel):
    id: int
    name: str
    ip_address: str
    ssh_user: str
    created_at: datetime

    class Config:
        orm_mode = True

# Pydantic Models for Users and Groups
class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False
    group_names: List[str] = [] # Use group names instead of IDs

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None
    group_names: Optional[List[str]] = None # Use group names instead of IDs

class UserResponse(BaseModel):
    id: int # UID from getent passwd
    username: str
    is_admin: bool
    roles: List[str] # Group names the user belongs to
    group_ids: List[int] = [] # GIDs of groups the user belongs to

class GroupCreate(BaseModel):
    name: str
    gid: Optional[int] = None # Allow specifying GID

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    gid: Optional[int] = None # Allow updating GID

class GroupUpdate(BaseModel):
    name: Optional[str] = None

class GroupResponse(BaseModel):
    id: int # GID from getent group
    name: str

class GpuStats(BaseModel):
    name: str
    utilization_gpu: float
    memory_used: float
    memory_total: float
    fan_speed: Optional[float] = None
    temperature_gpu: Optional[float] = None
    power_draw: Optional[float] = None
    power_limit: Optional[float] = None
    pci_bus_id: Optional[str] = None

class ActiveUser(BaseModel):
    username: str
    tty: Optional[str] = None
    from_host: Optional[str] = None
    login_time: Optional[str] = None
    idle_time: Optional[str] = None
    what: Optional[str] = None

class DiskPartition(BaseModel):
    name: str
    mountpoint: Optional[str] = None
    size: Optional[str] = None
    used: Optional[str] = None
    available: Optional[str] = None
    use_percent: Optional[str] = None
    fstype: Optional[str] = None
    uuid: Optional[str] = None
    model: Optional[str] = None
    serial: Optional[str] = None
    tran: Optional[str] = None # Transport (e.g., sata, nvme)
    type: Optional[str] = None # Type (e.g., disk, part, lvm)
    pkname: Optional[str] = None # Parent device name
    maj_min: Optional[str] = None # Major:Minor number
    rm: Optional[bool] = None # Removable device
    ro: Optional[bool] = None # Read-only device
    hotplug: Optional[bool] = None # Hotplug device
    kname: Optional[str] = None # Kernel device name
    label: Optional[str] = None
    partuuid: Optional[str] = None
    parttype: Optional[str] = None
    wwn: Optional[str] = None
    state: Optional[str] = None # Device state (e.g., live, running)
    vendor: Optional[str] = None
    rev: Optional[str] = None # Revision
    subsystems: Optional[str] = None
    # Additional fields for LUKS/LVM
    luks: Optional[bool] = False
    luks_unlocked: Optional[bool] = False
    lvm: Optional[bool] = False

class SystemStats(BaseModel):
    cpu_percent: float
    memory_percent: float
    gpu_stats: List[GpuStats]
    active_users: List[ActiveUser]
    disk_partitions: List[DiskPartition] # Add disk information


# === UNVERÄNDERTE ENDPUNKTE ===

@app.get("/hosts")
async def get_hosts():
    try:
        fc = get_fritz_connection()
        hosts = fc.call_action("Hosts", "GetHostList")
        return {"hosts": hosts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# SSH Command Execution Helper
async def _execute_ssh_command(server: Server, command: str, sudo_password: Optional[str] = None):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(server.ip_address, username=server.ssh_user, password=server.ssh_password, timeout=10)
        
        if sudo_password:
            # Use shlex.quote to properly escape the password for the shell
            quoted_password = shlex.quote(sudo_password)
            full_command = f"echo {quoted_password} | sudo -S {command}"
            stdin, stdout, stderr = ssh.exec_command(full_command, get_pty=True)
        else:
            stdin, stdout, stderr = ssh.exec_command(command)
        
        output = stdout.read().decode().strip()
        error = stderr.read().decode().strip()
        exit_status = stdout.channel.recv_exit_status()

        if exit_status != 0:
            logger.error(f"SSH command failed on {server.name} ({server.ip_address}): {command}\nError: {error}")
            raise HTTPException(status_code=500, detail=f"SSH command failed: {error}")
        
        return output, error
    except paramiko.AuthenticationException:
        raise HTTPException(status_code=401, detail="SSH authentication failed. Check username/password.")
    except paramiko.SSHException as e:
        raise HTTPException(status_code=500, detail=f"SSH connection error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during SSH: {str(e)}")
    finally:
        ssh.close()

# Helper to get server details from DB
def get_server_from_db(server_id: int):
    db = SessionLocal()
    server = db.query(Server).filter(Server.id == server_id).first()
    db.close()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server

# === USER AND GROUP MANAGEMENT ENDPOINTS (SSH-BASED) ===

@app.get("/servers/{server_id}/users/", response_model=List[UserResponse])
async def list_users(server_id: int):
    server = get_server_from_db(server_id)
    
    users_output, _ = await _execute_ssh_command(server, "getent passwd")
    users_temp_data: Dict[str, Dict] = {}
    for line in users_output.splitlines():
        parts = line.split(':')
        if len(parts) >= 6:
            username = parts[0]
            uid = int(parts[2])
            users_temp_data[username] = {"id": uid, "username": username, "is_admin": False, "roles": [], "group_ids": []}

    groups_output, _ = await _execute_ssh_command(server, "getent group")
    group_name_to_gid: Dict[str, int] = {}
    for line in groups_output.splitlines():
        parts = line.split(':')
        if len(parts) >= 3:
            group_name = parts[0]
            gid = int(parts[2])
            group_name_to_gid[group_name] = gid
            members = parts[3].split(',') if parts[3] else []
            
            if group_name == "sudo" or group_name == "admin":
                for member in members:
                    if member in users_temp_data:
                        users_temp_data[member]["is_admin"] = True
            
            for member in members:
                if member in users_temp_data:
                    if group_name not in users_temp_data[member]["roles"]:
                        users_temp_data[member]["roles"].append(group_name)
                    if gid not in users_temp_data[member]["group_ids"]:
                        users_temp_data[member]["group_ids"].append(gid)
    
    # Convert the temporary dictionary data into a list of UserResponse Pydantic models
    return [UserResponse(**data) for data in users_temp_data.values()]

@app.post("/servers/{server_id}/users/", response_model=UserResponse, status_code=201)
async def create_user(server_id: int, user: UserCreate):
    server = get_server_from_db(server_id)

    users_list = await list_users(server_id)
    if any(u.username == user.username for u in users_list):
        raise HTTPException(status_code=400, detail="User already exists on the server.")

    # Use shlex.quote for the password to ensure it's safely passed to openssl
    quoted_user_password = shlex.quote(user.password)
    password_hash_cmd = f"openssl passwd -1 {quoted_user_password}"
    password_hash, _ = await _execute_ssh_command(server, password_hash_cmd, server.ssh_password)

    group_args = ""
    if user.group_names:
        existing_groups = [g.name for g in await list_groups(server_id)]
        if not all(gn in existing_groups for gn in user.group_names):
            raise HTTPException(status_code=400, detail="One or more specified groups do not exist on the server.")
        group_args = f"-G {','.join(user.group_names)}"
    
    if user.is_admin and "sudo" not in user.group_names:
        group_args = f"{group_args},sudo" if group_args else "-G sudo"

    # Add primary group if specified, otherwise useradd will use a default
    # For simplicity, we're not adding primary group logic here, assuming default behavior is fine.
    # If a specific primary group is needed, `useradd -g <primary_group>` would be used.

    create_cmd = f"useradd -m -p '{password_hash}' {group_args} {user.username}"
    await _execute_ssh_command(server, create_cmd, server.ssh_password)

    updated_users = await list_users(server_id)
    newly_created_user = next((u for u in updated_users if u.username == user.username), None)
    if not newly_created_user:
        raise HTTPException(status_code=500, detail="Failed to retrieve newly created user.")
    return newly_created_user

@app.put("/servers/{server_id}/users/{username}", response_model=UserResponse)
async def update_user(server_id: int, username: str, user_update: UserUpdate):
    server = get_server_from_db(server_id)

    users_list = await list_users(server_id)
    existing_user = next((u for u in users_list if u.username == username), None)
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found on the server.")

    update_cmds = []

    if user_update.username is not None and user_update.username != username:
        if any(u.username == user_update.username for u in users_list):
            raise HTTPException(status_code=400, detail="New username already exists on the server.")
        update_cmds.append(f"usermod -l {user_update.username} {username}")
        username = user_update.username

    if user_update.password is not None:
        quoted_update_password = shlex.quote(user_update.password)
        password_hash_cmd = f"openssl passwd -1 {quoted_update_password}"
        password_hash, _ = await _execute_ssh_command(server, password_hash_cmd, server.ssh_password)
        update_cmds.append(f"usermod -p {shlex.quote(password_hash)} {username}")

    if user_update.group_names is not None:
        existing_groups = await list_groups(server_id)
        existing_group_names = {g.name for g in existing_groups}
        if not all(gn in existing_group_names for gn in user_update.group_names):
            raise HTTPException(status_code=400, detail="One or more specified groups do not exist on the server.")
        
        # To update groups, we need to replace all secondary groups.
        # First, remove user from all current secondary groups (except primary, which usermod -G doesn't touch)
        # Then add to new groups. This is complex with usermod -G.
        # A simpler approach for full replacement is to use `usermod -G new_groups user`
        # However, this removes the user from all groups not specified.
        # If the intent is to ADD/REMOVE specific groups, it's more complex.
        # For now, assuming -G replaces all secondary groups.
        group_str = ",".join(user_update.group_names)
        update_cmds.append(f"usermod -G {group_str} {username}")
    
    if user_update.is_admin is not None:
        # Determine current admin status based on existing_user.roles
        is_currently_admin = "sudo" in existing_user.roles or "admin" in existing_user.roles

        if user_update.is_admin and not is_currently_admin:
            # Add to sudo group if not already admin and requested to be admin
            update_cmds.append(f"usermod -aG sudo {username}")
        elif not user_update.is_admin and is_currently_admin:
            # Remove from sudo group if currently admin and requested not to be admin
            # This is tricky as a user might be in multiple admin-like groups.
            # For simplicity, we'll just remove from 'sudo' if it's present.
            if "sudo" in existing_user.roles:
                update_cmds.append(f"gpasswd -d {username} sudo")
            # If there are other admin groups like 'admin', more logic would be needed.

    if not update_cmds:
        raise HTTPException(status_code=400, detail="No valid fields to update.")

    for cmd in update_cmds:
        await _execute_ssh_command(server, cmd, server.ssh_password)

    updated_users = await list_users(server_id)
    updated_user_obj = next((u for u in updated_users if u.username == username), None)
    if not updated_user_obj:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated user.")
    return updated_user_obj

@app.delete("/servers/{server_id}/users/{username}", status_code=204)
async def delete_user(server_id: int, username: str):
    server = get_server_from_db(server_id)

    users_list = await list_users(server_id)
    if not any(u.username == username for u in users_list):
        raise HTTPException(status_code=404, detail="User not found on the server.")

    delete_cmd = f"userdel -r {username}"
    await _execute_ssh_command(server, delete_cmd, server.ssh_password)
    return

@app.get("/servers/{server_id}/groups/", response_model=List[GroupResponse])
async def list_groups(server_id: int):
    server = get_server_from_db(server_id)
    groups_output, _ = await _execute_ssh_command(server, "getent group")
    
    groups_data = []
    for line in groups_output.splitlines():
        parts = line.split(':')
        if len(parts) >= 3:
            group_name = parts[0]
            gid = int(parts[2])
            groups_data.append(GroupResponse(id=gid, name=group_name))
    return groups_data

@app.post("/servers/{server_id}/groups/", response_model=GroupResponse, status_code=201)
async def create_group(server_id: int, group: GroupCreate):
    server = get_server_from_db(server_id)

    groups_list = await list_groups(server_id)
    if any(g.name == group.name for g in groups_list):
        raise HTTPException(status_code=400, detail="Group with this name already exists on the server.")
    if group.gid is not None and any(g.id == group.gid for g in groups_list):
        raise HTTPException(status_code=400, detail="Group with this GID already exists on the server.")

    create_cmd = f"groupadd "
    if group.gid is not None:
        create_cmd += f"-g {group.gid} "
    create_cmd += f"{group.name}"
    await _execute_ssh_command(server, create_cmd, server.ssh_password)

    updated_groups = await list_groups(server_id)
    newly_created_group = next((g for g in updated_groups if g.name == group.name), None)
    if not newly_created_group:
        raise HTTPException(status_code=500, detail="Failed to retrieve newly created group.")
    return newly_created_group

@app.put("/servers/{server_id}/groups/{group_name}", response_model=GroupResponse)
async def update_group(server_id: int, group_name: str, group_update: GroupUpdate):
    server = get_server_from_db(server_id)

    groups_list = await list_groups(server_id)
    existing_group = next((g for g in groups_list if g.name == group_name), None)
    if not existing_group:
        raise HTTPException(status_code=404, detail="Group not found on the server.")

    update_cmds = []

    if group_update.name is not None and group_update.name != group_name:
        if any(g.name == group_update.name for g in groups_list):
            raise HTTPException(status_code=400, detail="New group name already exists on the server.")
        update_cmds.append(f"groupmod -n {group_update.name} {group_name}")
        group_name = group_update.name # Update group_name for subsequent commands

    if group_update.gid is not None and group_update.gid != existing_group.id:
        if any(g.id == group_update.gid for g in groups_list):
            raise HTTPException(status_code=400, detail="New GID already exists on the server.")
        update_cmds.append(f"groupmod -g {group_update.gid} {group_name}")
    
    if not update_cmds:
        raise HTTPException(status_code=400, detail="No valid fields to update.")

    for cmd in update_cmds:
        await _execute_ssh_command(server, cmd, server.ssh_password)

    updated_groups = await list_groups(server_id)
    updated_group_obj = next((g for g in updated_groups if g.name == group_name), None)
    if not updated_group_obj:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated group.")
    return updated_group_obj

@app.delete("/servers/{server_id}/groups/{group_name}", status_code=204)
async def delete_group(server_id: int, group_name: str):
    server = get_server_from_db(server_id)

    groups_list = await list_groups(server_id)
    if not any(g.name == group_name for g in groups_list):
        raise HTTPException(status_code=404, detail="Group not found on the server.")

    delete_cmd = f"groupdel {group_name}"
    await _execute_ssh_command(server, delete_cmd, server.ssh_password)
    return

@app.get("/servers/", response_model=List[ServerResponse])
@app.get("/servers", response_model=List[ServerResponse]) # Allow requests without trailing slash
async def list_servers():
    db = SessionLocal()
    servers = db.query(Server).all()
    db.close()
    return servers

@app.post("/servers/{server_id}/cockpit-link")
async def get_cockpit_link(server_id: int):
    db = SessionLocal()
    server = db.query(Server).filter(Server.id == server_id).first()
    db.close()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    cockpit_url = f"https://{server.ip_address}:9090"
    return {"cockpit_url": cockpit_url}


# === ÜBERARBEITETE ENDPUNKTE ===


@app.post("/servers/", response_model=ServerResponse)
@app.post("/servers", response_model=ServerResponse, include_in_schema=False) 
async def create_server(server: ServerCreate):
    """
    Legt einen neuen Server an, testet SSH und installiert Cockpit UND Netdata.
    """
    logger.info(f"[CREATE_SERVER] Teste SSH zu {server.ip_address} als {server.ssh_user}")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(server.ip_address, username=server.ssh_user, password=server.ssh_password, timeout=10)
        logger.info(f"[CREATE_SERVER] SSH-Verbindung zu {server.ip_address} erfolgreich.")

        # Schritt 1: Cockpit installieren (bleibt unverändert)
        # Use shlex.quote for the password
        quoted_ssh_password = shlex.quote(server.ssh_password)
        cockpit_install_cmd = (
            f"echo {quoted_ssh_password} | sudo -S apt-get update && "
            f"echo {quoted_ssh_password} | sudo -S apt-get install -y cockpit && "
            f"echo {quoted_ssh_password} | sudo -S systemctl enable --now cockpit.socket"
        )
        
        logger.info(f"[CREATE_SERVER] Installiere Cockpit auf {server.ip_address}...")
        stdin, stdout, stderr = ssh.exec_command(cockpit_install_cmd, get_pty=True)
        # Warten auf Beendigung des Befehls
        exit_status = stdout.channel.recv_exit_status()
        logger.info(f"[CREATE_SERVER] Cockpit-Installation beendet mit Status {exit_status}.")
        if exit_status != 0:
            logger.error(f"Cockpit install stderr: {stderr.read().decode()}")

        # Schritt 2: Netdata installieren (NEU)
        netdata_install_cmd = "bash <(curl -Ss https://my-netdata.io/kickstart.sh) --non-interactive --dont-wait"
        logger.info(f"[CREATE_SERVER] Installiere Netdata auf {server.ip_address}...")
        stdin, stdout, stderr = ssh.exec_command(netdata_install_cmd, get_pty=True)
        exit_status = stdout.channel.recv_exit_status()
        logger.info(f"[CREATE_SERVER] Netdata-Installation beendet mit Status {exit_status}.")
        if exit_status != 0:
            logger.error(f"Netdata install stderr: {stderr.read().decode()}")

        ssh.close()
    except Exception as e:
        logger.error(f"[CREATE_SERVER][ERROR] {str(e)}")
        raise HTTPException(status_code=400, detail=f"SSH-Verbindung oder Software-Installation fehlgeschlagen: {str(e)}")

    # Server in DB speichern
    db = SessionLocal()
    db_server_check = db.query(Server).filter(Server.ip_address == server.ip_address).first()
    if db_server_check:
        db.close()
        raise HTTPException(status_code=400, detail="Ein Server mit dieser IP-Adresse existiert bereits.")
        
    db_server = Server(**server.dict())
    db.add(db_server)
    db.commit()
    db.refresh(db_server)
    db.close()
    return db_server

@app.put("/servers/{server_id}", response_model=ServerResponse)
async def update_server(server_id: int, server: ServerUpdate):
    """
    Aktualisiert einen bestehenden Server in der Datenbank.
    """
    db = SessionLocal()
    db_server = db.query(Server).filter(Server.id == server_id).first()
    if not db_server:
        db.close()
        raise HTTPException(status_code=404, detail="Server not found")

    # Update server attributes
    db_server.name = server.name
    db_server.ip_address = server.ip_address
    db_server.ssh_user = server.ssh_user
    db_server.ssh_password = server.ssh_password # Update password as well

    db.commit()
    db.refresh(db_server)
    db.close()
    return db_server

@app.delete("/servers/{server_id}")
async def delete_server(server_id: int):
    """
    Löscht einen Server aus der Datenbank.
    """
    db = SessionLocal()
    db_server = db.query(Server).filter(Server.id == server_id).first()
    if not db_server:
        db.close()
        raise HTTPException(status_code=404, detail="Server not found")
    
    db.delete(db_server)
    db.commit()
    db.close()
    return {"message": "Server deleted successfully"}

@app.get("/servers/{server_id}/stats", response_model=SystemStats)
async def get_server_stats(server_id: int):
    """
    Holt Systemstatistiken über die Netdata-API (CPU/RAM) und SSH (GPU/Users).
    """
    db = SessionLocal()
    server = db.query(Server).filter(Server.id == server_id).first()
    db.close()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    # --- CPU und RAM über Netdata API (FINALER, ROBUSTER ANSATZ) ---
    cpu_percent = 0.0
    memory_percent = 0.0
    netdata_url = f"http://{server.ip_address}:19999/api/v1/data"
    
    try:
        # === KORREKTUR: Wir gehen zurück zum universellen 'system.cpu'-Chart ===
        # Diesmal parsen wir es aber korrekt und sicher.
        cpu_params = {'chart': 'system.cpu', 'after': -1, 'points': 1, 'group': 'average', 'format': 'json'}
        
        logger.info(f"[STATS][NETDATA] Frage CPU-Nutzung ab (system.cpu)...")
        cpu_resp = requests.get(netdata_url, params=cpu_params, timeout=5)
        cpu_resp.raise_for_status() # Löst bei 404/500 einen Fehler aus
        cpu_data = cpu_resp.json()

        # === KORREKTES PARSING ===
        # Wir summieren alle CPU-Zustände, die nicht 'idle' sind.
        labels = cpu_data.get('labels', [])
        values = cpu_data.get('data', [[]])[0]

        if labels and values:
            total_usage = 0.0
            for i, label in enumerate(labels):
                if label != 'time' and label != 'idle':
                    total_usage += values[i]
            cpu_percent = total_usage
        else:
            logger.warning(f"[STATS][NETDATA] Unerwartetes CPU-Datenformat: {cpu_data}")

        # --- RAM-Nutzung ---
        logger.info(f"[STATS][NETDATA] Frage Speichernutzung ab (system.ram)...")
        mem_params = {'chart': 'system.ram', 'after': -1, 'points': 1, 'group': 'average', 'format': 'json'}
        mem_resp = requests.get(netdata_url, params=mem_params, timeout=5)
        mem_resp.raise_for_status()
        mem_data = mem_resp.json()
        logger.info(f"[STATS][NETDATA] Speichernutzung erfolgreich abgefragt.")

        mem_labels = mem_data.get('labels', [])
        mem_values_list = mem_data.get('data', [])

        total_mem = 0.0
        used_mem = 0.0

        if not mem_labels or not mem_values_list:
            logger.warning(f"[STATS][NETDATA] Keine oder ungültige RAM-Daten erhalten. Labels: {mem_labels}, Data: {mem_values_list}")
        else:
            mem_values = mem_values_list[0] # Get the first data point

            try:
                if 'total' in mem_labels:
                    # Case 1: 'total' label is present
                    total_mem_index = mem_labels.index('total')
                    used_mem_index = mem_labels.index('used')
                    total_mem = mem_values[total_mem_index]
                    used_mem = mem_values[used_mem_index]
                    logger.info(f"[STATS][NETDATA] RAM: total={total_mem}, used={used_mem}")
                else:
                    # Case 2: 'total' label is missing, calculate total memory from components
                    logger.warning(f"[STATS][NETDATA] 'total' Label nicht in system.ram gefunden. Berechne Gesamtspeicher aus Komponenten.")
                    
                    required_calc_labels = ['used', 'free', 'cached', 'buffers']
                    if all(label in mem_labels for label in required_calc_labels):
                        used_mem_index = mem_labels.index('used')
                        free_mem_index = mem_labels.index('free')
                        cached_mem_index = mem_labels.index('cached')
                        buffers_mem_index = mem_labels.index('buffers')

                        used_mem = mem_values[used_mem_index]
                        free_mem = mem_values[free_mem_index]
                        cached_mem = mem_values[cached_mem_index]
                        buffers_mem = mem_values[buffers_mem_index]

                        total_mem = used_mem + free_mem + cached_mem + buffers_mem
                        logger.info(f"[STATS][NETDATA] RAM (calculated): used={used_mem}, free={free_mem}, cached={cached_mem}, buffers={buffers_mem}, total={total_mem}")
                    else:
                        missing = [label for label in required_calc_labels if label not in mem_labels]
                        logger.error(f"[STATS][NETDATA] Fehlende Speicher-Labels für Berechnung. Benötigt: {required_calc_labels}, Gefunden: {mem_labels}. Fehlend: {missing}")

            except IndexError:
                logger.error(f"[STATS][NETDATA] Indexfehler beim Zugriff auf RAM-Daten. Labels: {mem_labels}, Values: {mem_values}")
            except ValueError as e: # This would catch if 'used' or other required labels are missing during calculation
                logger.error(f"[STATS][NETDATA] Fehlendes erwartetes Speicher-Label für Berechnung: {e}. Labels: {mem_labels}")

        if total_mem > 0:
            memory_percent = (used_mem / total_mem) * 100
        else:
            logger.warning(f"[STATS][NETDATA] Ungültiger Wert für total_mem: {total_mem}. Kann memory_percent nicht berechnen.")

    except requests.exceptions.RequestException as e:
        logger.warning(f"[STATS][NETDATA] Fehler bei der Abfrage von Netdata auf {server.ip_address}: {e}")

    # --- GPU-Infos und User via SSH (unverändert) ---
    gpu_stats = []
    active_users = []
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(server.ip_address, username=server.ssh_user, password=server.ssh_password, timeout=10)
        
        # GPU
        # Query basic GPU metrics that are generally supported
        gpu_query_cmd = (
            "nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total,"
            "fan.speed,temperature.gpu,power.draw,power.limit,pci.bus_id "
            "--format=csv,noheader,nounits"
        )
        stdin, stdout, stderr = ssh.exec_command(gpu_query_cmd)
        gpu_output = stdout.read().decode().strip()
        
        for line in gpu_output.splitlines():
            vals = [v.strip() for v in line.split(',')]
            # Expected 9 values based on the simplified query
            if len(vals) == 9:
                try:
                    gpu_stats.append(GpuStats(
                        name=vals[0],
                        utilization_gpu=float(vals[1]),
                        memory_used=float(vals[2]),
                        memory_total=float(vals[3]),
                        fan_speed=float(vals[4]) if vals[4] != '[Not Supported]' else None,
                        temperature_gpu=float(vals[5]),
                        power_draw=float(vals[6]),
                        power_limit=float(vals[7]),
                        pci_bus_id=vals[8]
                    ))
                except ValueError as e:
                    logger.error(f"Error parsing GPU stats line '{line}': {e}")
            else:
                logger.warning(f"Unexpected number of values in GPU stats line: '{line}' (Expected 9, got {len(vals)})")
        
        # User
        # Modified command to get full 'w' output for more structured parsing
        stdin, stdout, stderr = ssh.exec_command("w")
        users_output = stdout.read().decode().strip()
        
        active_users_parsed = []
        if users_output:
            lines = users_output.splitlines()
            if len(lines) > 2: # Skip header lines
                for line in lines[2:]:
                    parts = line.split(maxsplit=7) # Split into at most 8 parts
                    if len(parts) >= 4: # Ensure basic parts are present
                        username = parts[0]
                        tty = parts[1] if len(parts) > 1 else None
                        from_host = parts[2] if len(parts) > 2 else None
                        login_time = parts[3] if len(parts) > 3 else None
                        idle_time = parts[4] if len(parts) > 4 else None
                        what = parts[7] if len(parts) > 7 else None # The 'WHAT' column can contain spaces

                        active_users_parsed.append(ActiveUser(
                            username=username,
                            tty=tty,
                            from_host=from_host,
                            login_time=login_time,
                            idle_time=idle_time,
                            what=what
                        ))
                    else:
                        logger.warning(f"[STATS][SSH] Unexpected 'w' output format for line: {line}")
            else:
                logger.warning(f"[STATS][SSH] 'w' command returned less than 3 lines of output.")
        ssh.close()
    except Exception as e:
        logger.warning(f"[STATS][SSH] Fehler bei der Abfrage von GPU/Usern auf {server.ip_address}: {e}")

    # --- Disk Information via SSH ---
    disk_partitions = []
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(server.ip_address, username=server.ssh_user, password=server.ssh_password, timeout=10)

        # Get block device information using lsblk
        # Using -o for specific columns to make parsing more robust
        lsblk_cmd = "lsblk -J -o NAME,MAJ:MIN,RM,RO,SIZE,STATE,FSTYPE,MOUNTPOINT,UUID,PARTUUID,PARTTYPE,LABEL,MODEL,SERIAL,TRAN,TYPE,PKNAME,VENDOR,REV,HOTPLUG,KNAME,WWN,SUBSYSTEMS"
        stdin, stdout, stderr = ssh.exec_command(lsblk_cmd)
        lsblk_output = stdout.read().decode().strip()
        lsblk_error = stderr.read().decode().strip()

        if lsblk_error:
            logger.warning(f"[STATS][SSH] lsblk stderr: {lsblk_error}")

        lsblk_data = json.loads(lsblk_output)
        
        # Get disk usage information using df -h
        df_cmd = "df -h --output=source,size,used,avail,pcent,target"
        stdin, stdout, stderr = ssh.exec_command(df_cmd)
        df_output = stdout.read().decode().strip()
        df_error = stderr.read().decode().strip()

        if df_error:
            logger.warning(f"[STATS][SSH] df stderr: {df_error}")

        df_data = {}
        df_lines = df_output.splitlines()
        if len(df_lines) > 1: # Skip header
            for line in df_lines[1:]:
                parts = line.split()
                if len(parts) == 6:
                    df_data[parts[0]] = {
                        "size": parts[1],
                        "used": parts[2],
                        "available": parts[3],
                        "use_percent": parts[4],
                        "mountpoint": parts[5]
                    }
        
        def parse_lsblk_device(device_data: Dict):
            disk_info = DiskPartition(
                name=device_data.get('name'),
                maj_min=device_data.get('maj:min'),
                rm=bool(device_data.get('rm')),
                ro=bool(device_data.get('ro')),
                size=device_data.get('size'),
                state=device_data.get('state'),
                fstype=device_data.get('fstype'),
                mountpoint=device_data.get('mountpoint'),
                uuid=device_data.get('uuid'),
                partuuid=device_data.get('partuuid'),
                parttype=device_data.get('parttype'),
                label=device_data.get('label'),
                model=device_data.get('model'),
                serial=device_data.get('serial'),
                tran=device_data.get('tran'),
                type=device_data.get('type'),
                pkname=device_data.get('pkname'),
                vendor=device_data.get('vendor'),
                rev=device_data.get('rev'),
                hotplug=bool(device_data.get('hotplug')),
                kname=device_data.get('kname'),
                wwn=device_data.get('wwn'),
                subsystems=device_data.get('subsystems')
            )

            # Check for LUKS
            if disk_info.fstype == 'crypto_LUKS':
                disk_info.luks = True
                # To check if LUKS is unlocked, we'd need to parse `lsblk -o NAME,TYPE,MOUNTPOINT` and see if the decrypted device is mounted
                # This is a more complex check, for now, we'll assume it's not explicitly unlocked unless we can confirm.
                # A more robust check would involve `cryptsetup status <device>` or `lsblk -o NAME,TYPE,MOUNTPOINT` and checking for a mapped device.
                # For simplicity, we'll leave luks_unlocked as False unless a specific check is added.
                # Example: check if a device with type 'crypt' and a mountpoint exists, and its parent is this LUKS device.
                # This would require another lsblk call or more complex parsing.

            # Check for LVM
            if disk_info.type == 'lvm':
                disk_info.lvm = True
            
            # Merge df data if available
            if disk_info.mountpoint and disk_info.mountpoint in [d.get("mountpoint") for d in df_data.values()]:
                # Find the df entry by mountpoint
                df_entry = next((v for k, v in df_data.items() if v.get("mountpoint") == disk_info.mountpoint), None)
                if df_entry:
                    disk_info.size = df_entry.get("size")
                    disk_info.used = df_entry.get("used")
                    disk_info.available = df_entry.get("available")
                    disk_info.use_percent = df_entry.get("use_percent")
            
            return disk_info

        if 'blockdevices' in lsblk_data:
            for device in lsblk_data['blockdevices']:
                disk_partitions.append(parse_lsblk_device(device))
                if 'children' in device:
                    for child in device['children']:
                        disk_partitions.append(parse_lsblk_device(child))

        ssh.close()
    except Exception as e:
        logger.warning(f"[STATS][SSH] Fehler bei der Abfrage von Disk-Informationen auf {server.ip_address}: {e}")
        
    return SystemStats(
        cpu_percent=round(cpu_percent, 2),
        memory_percent=round(memory_percent, 2),
        gpu_stats=gpu_stats,
        active_users=active_users,
        disk_partitions=disk_partitions
    )
