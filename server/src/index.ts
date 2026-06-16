import express from 'express';
import cors from 'cors';
import languagesRouter from './routes/languages.js';
import translationsRouter from './routes/translations.js';
import localeRouter from './routes/locale.js';
import ioRouter from './routes/io.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/languages', languagesRouter);
app.use('/api/translations', translationsRouter);
app.use('/api/locale', localeRouter);
app.use('/api/io', ioRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`i18n CMS Server running on http://localhost:${PORT}`);
});

export default app;
