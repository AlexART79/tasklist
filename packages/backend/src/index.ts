import 'dotenv/config';
import { app } from './app';

const port = process.env.PORT ?? 3001;

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
