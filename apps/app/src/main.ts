import { botInit } from '@bot-melissa/app/vk';
import { Client } from '@elastic/elasticsearch';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

dotenv.config();

const main = () => {
  mongoose.set('strictQuery', true);
  botInit();
  const client = new Client({
    node: 'http://localhost:9200',
    auth: {
      username: 'elastic',
      password: 'changeme'
    }
  });
};

main();
