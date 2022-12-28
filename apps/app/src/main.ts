import { botInit } from '@bot-melissa/app/vk';
import * as mongoose from 'mongoose';

const main = () => {
  mongoose.set('strictQuery', true);
  botInit();
};

main();
