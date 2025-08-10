'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSpring, animated } from '@react-spring/web';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FaHome, FaCog, FaBars, FaUsers, FaHdd, FaUsersCog } from 'react-icons/fa'; // Import React Icons and FaHdd, FaUsersCog

// The component was duplicated, removing the duplicate.
// The previous change already added the new links.

function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuAnimation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0%)' : 'translateY(-100%)',
    config: { tension: 300, friction: 20 },
  });

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-700 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold">
          Server Dashboard
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6">
          <Link href="/" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-2">
            <FaHome className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link href="/settings" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-2">
            <FaCog className="h-5 w-5" />
            <span>Manage Servers</span>
          </Link>
          <Link href="/users" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-2">
            <FaUsers className="h-5 w-5" />
            <span>User Management</span>
          </Link>
          <Link href="/groups" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-2">
            <FaUsersCog className="h-5 w-5" />
            <span>Group Management</span>
          </Link>
          <Link href="/drives" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-2">
            <FaHdd className="h-5 w-5" />
            <span>Drives</span>
          </Link>
        </div>

        {/* Mobile Navigation (Hamburger Menu) */}
        <div className="md:hidden">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-blue-500">
                <FaBars className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <animated.div style={menuAnimation}>
              <DropdownMenuContent className="w-56 bg-white shadow-lg rounded-md mt-2 mr-4">
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center space-x-2 p-2 hover:bg-gray-100">
                  <FaHome className="h-5 w-5" />
                  <span>Home</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center space-x-2 p-2 hover:bg-gray-100">
                  <FaCog className="h-5 w-5" />
                  <span>Manage Servers</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/users" className="flex items-center space-x-2 p-2 hover:bg-gray-100">
                  <FaUsers className="h-5 w-5" />
                  <span>User Management</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/groups" className="flex items-center space-x-2 p-2 hover:bg-gray-100">
                  <FaUsersCog className="h-5 w-5" />
                  <span>Group Management</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/drives" className="flex items-center space-x-2 p-2 hover:bg-gray-100">
                  <FaHdd className="h-5 w-5" />
                  <span>Drives</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
            </animated.div>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
