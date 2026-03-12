import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gift, ChevronRight, Crown, Star, Zap, Timer, Menu } from 'lucide-react';
// import { Users, MessageSquare, Brain } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  xp?: number;
  isCollapsed?: boolean;
}

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const SidebarItem = ({ icon, title, children, xp, isCollapsed }: SidebarItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
    }
  }, [isCollapsed]);

  if (isCollapsed) {
    return (
      <div className="relative group">
        <button className="p-4 w-full flex justify-center hover:bg-white/5 transition-colors duration-200">
          {icon}
        </button>
        <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
          <div className="bg-[--color-kiki-navy] rounded-lg shadow-lg py-2 px-4 whitespace-nowrap">
            <span className="text-white">{title}</span>
            {xp && (
              <span className="ml-2 text-[--color-ghibli-pink]">+{xp} XP</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between p-4",
          "hover:bg-white/5 transition-colors duration-200",
          "text-black hover:text-black"
        )}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{title}</span>
          {xp && (
            <span className="ml-2 px-2 py-1 bg-[--color-ghibli-blue]/20 rounded-full text-xs">
              +{xp} XP
            </span>
          )}
        </div>
        <ChevronRight
          className={clsx(
            "transform transition-transform duration-200",
            isOpen && "rotate-90"
          )}
          size={16}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-white/5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = ({ isExpanded, onToggle }: SidebarProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  //@ts-ignore
  const sidebarLinks = [
    // Temporarily removed features
    // { to: '/friends', icon: <Users size={20} />, label: 'Friends' },
    // { to: '/chat', icon: <MessageSquare size={20} />, label: 'Chat' },
    // { to: '/study-room', icon: <Brain size={20} />, label: 'Study Room' },
  ];

  const sidebarVariants = {
    expanded: {
      width: 300,
      x: 0,
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    collapsed: {
      width: isMobile ? 0 : 80,
      x: isMobile ? -80 : 0,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  };

  return (
    <>
      <motion.div
        initial={false}
        animate={isExpanded ? 'expanded' : 'collapsed'}
        variants={sidebarVariants}
        className={clsx(
          "fixed left-0 h-[calc(100vh-4rem)]",
          "bg-white/95 backdrop-blur-sm",
          "border-r border-gray-200",
          "flex flex-col",
          "z-40 top-16"
        )}
      >
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Social Links */}
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={clsx(
                "w-full flex items-center gap-3 p-4",
                "hover:bg-white/5 transition-colors duration-200",
                "text-black hover:text-black",
                location.pathname === link.to && "bg-[--color-ghibli-blue]/10",
                !isExpanded && "justify-center"
              )}
            >
              {link.icon}
              {isExpanded && <span>{link.label}</span>}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          onClick={onToggle}
          className={clsx(
            "fixed bottom-4 left-4 z-50",
            "p-3 rounded-full",
            "bg-[--color-kiki-navy] text-white",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-200"
          )}
        >
          <Menu size={24} />
        </button>
      )}
    </>
  );
};

export default Sidebar;