'use client';

import { Menu } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageOutlined,
  SettingOutlined,
  BookOutlined,
  FunctionOutlined,
} from '@ant-design/icons';

const menuItems = [
  {
    key: '/',
    icon: <MessageOutlined />,
    label: <Link href="/">对话</Link>,
  },
  {
    key: '/templates',
    icon: <BookOutlined />,
    label: <Link href="/templates">提示词模板</Link>,
  },
  {
    key: '/functions',
    icon: <FunctionOutlined />,
    label: <Link href="/functions">函数配置</Link>,
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: <Link href="/settings">设置</Link>,
  },
];

export function NavMenu() {
  const pathname = usePathname();
  const selectedKey = menuItems.find(item => 
    pathname.startsWith(item.key === '/' ? item.key : item.key + '/')
  )?.key || pathname;

  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      className="border-0"
    />
  );
} 