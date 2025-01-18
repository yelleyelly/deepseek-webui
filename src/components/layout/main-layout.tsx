'use client';

import { Layout } from 'antd';
import { NavMenu } from './nav-menu';
import { PageBreadcrumb } from './breadcrumb';

const { Sider, Content } = Layout;

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout className="min-h-screen">
      <Sider theme="light" className="border-r" width={220}>
        <NavMenu />
      </Sider>
      <Layout>
        <Content className="p-6">
          <PageBreadcrumb />
          {children}
        </Content>
      </Layout>
    </Layout>
  );
} 