import { ConfigInterface } from '@bot-melissa/shared/interfaces/config.interface';

export const environment: ConfigInterface = {
  production: false,
  token: process.env.TOKEN || '3499b624dc715347e2b88d24eaa14afe936ea273fad9709cd720c6d2770e499abe6f926125619d2b14aed',
  groupId: Number(process.env.GROUP_ID) || 193700439,
  db: process.env.DB || 'mongodb://localhost:27017/bot',
  secret: process.env.SECRET || 'd2103dfe7288ccb50a4a7af9ff90ec52',
  botName: 'Тест'
};
