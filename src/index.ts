import express, { Request, Response } from "express";
import routerAttack from "./routes/techniques.js";
import { seedDatabase } from "./db/db.seed.js";
import routerCampaigns from "./routes/campaigns.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("TypeScript Express Server is running!");
});

seedDatabase();

app.use('/', routerAttack);
app.use('/campaigns', routerCampaigns)

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
