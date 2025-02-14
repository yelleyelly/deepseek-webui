'use client';

import { useEffect, useState } from 'react';
import { Card, Statistic, Tooltip } from 'antd';
import { WalletOutlined } from '@ant-design/icons';
import { useSettingsStore } from '@/lib/store/settings-store';
import { getBalance, BalanceResponse } from '@/lib/api/deepseek';
import styles from '@/styles/layout/balance-display.module.css';

export const BalanceDisplay = () => {
  const { apiKey } = useSettingsStore();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!apiKey) {
      setBalance(null);
      return;
    }
    
    try {
      setLoading(true);
      const data = await getBalance(apiKey);
      console.error(data);
      setBalance(data);
    } catch (error) {
      console.error('获取余额失败:', error);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  // 监听 apiKey 变化
  useEffect(() => {
    fetchBalance();
  }, [apiKey]);

  // 定时刷新
  useEffect(() => {
    if (!apiKey) return;
    
    const interval = setInterval(fetchBalance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey]);

  if (!balance) return null;
  console.error(balance);
  console.error(balance.data.totalBalance);
  return (
    <div className={styles.container}>
      <Card loading={loading} bordered={false} size="small" className={styles.card}>
        <Tooltip
          title={
            <>
              <div>赠金余额: ¥{balance.data.balance}</div>
              <div>充值余额: ¥{balance.data.chargeBalance}</div>
            </>
          }
        >
          <Statistic
            title="账户余额"
            value={balance.data.totalBalance}
            prefix={<WalletOutlined />}
            suffix="¥"
            precision={2}
          />
        </Tooltip>
      </Card>
    </div>
  );
}; 
