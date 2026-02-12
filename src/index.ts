import express, { Request, Response } from "express";
import routerAttack from "./routes/techniques.js";
import { seedDatabase } from "./db/db.seed.js";
import routerCampaigns from "./routes/campaigns.js";
import routerSoftware from "./routes/software.route.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("TypeScript Express Server is running!");
});

seedDatabase();

app.use('/', routerAttack);
app.use('/campaigns', routerCampaigns)
app.use('/software', routerSoftware)

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
