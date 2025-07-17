import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vessels = pgTable("vessels", {
  id: serial("id").primaryKey(),
  imo: text("imo").notNull().unique(),
  mmsi: text("mmsi").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  flag: text("flag"),
  length: real("length"),
  width: real("width"),
  status: text("status").notNull(),
  speed: real("speed").notNull(),
  heading: real("heading"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  destination: text("destination"),
  eta: timestamp("eta"),
  lastUpdate: timestamp("last_update").notNull(),
  riskLevel: text("risk_level").notNull().default("low"),
  riskAssessment: text("risk_assessment"),
});

export const vesselTrail = pgTable("vessel_trail", {
  id: serial("id").primaryKey(),
  vesselId: integer("vessel_id").references(() => vessels.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  speed: real("speed"),
  heading: real("heading"),
});

export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  radius: real("radius").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  vesselId: integer("vessel_id").references(() => vessels.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull(),
});

export const insertVesselSchema = createInsertSchema(vessels).omit({
  id: true,
  lastUpdate: true,
});

export const insertVesselTrailSchema = createInsertSchema(vesselTrail).omit({
  id: true,
});

export const insertGeofenceSchema = createInsertSchema(geofences).omit({
  id: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export type InsertVessel = z.infer<typeof insertVesselSchema>;
export type Vessel = typeof vessels.$inferSelect;
export type VesselTrail = typeof vesselTrail.$inferSelect;
export type Geofence = typeof geofences.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type InsertVesselTrail = z.infer<typeof insertVesselTrailSchema>;
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
