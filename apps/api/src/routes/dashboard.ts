import { Router } from "express";
import { getKpis } from "../controllers/dashboard/kpis";
import { getStatus } from "../controllers/dashboard/status";
import { getTrend } from "../controllers/dashboard/trend";
import { getVolume } from "../controllers/dashboard/volume";
import { getZone3 } from "../controllers/dashboard/zone3";

const dashboardRouter: Router = Router();

dashboardRouter.get("/kpis", getKpis);
dashboardRouter.get("/status", getStatus);
dashboardRouter.get("/volume", getVolume);
dashboardRouter.get("/trend", getTrend);
dashboardRouter.get("/zone3", getZone3);

export default dashboardRouter;
