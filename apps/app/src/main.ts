import { botInit } from '@bot-melissa/app/vk';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

dotenv.config();

const main = () => {
  mongoose.set('strictQuery', true);
  botInit();
};

main();
