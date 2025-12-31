const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

/* =====================
   ✅ CORS CONFIG (FIXED)
===================== */
app.use(cors({
  origin: "https://hemo-bank.vercel.app", // ❌ slash removed
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

/* =====================
   🔐 ASTRA CONFIG
===================== */
const ASTRA_DB_ID = process.env.ASTRA_DB_ID;
const ASTRA_REGION = process.env.ASTRA_REGION;
const ASTRA_KEYSPACE = process.env.ASTRA_KEYSPACE;
const ASTRA_TOKEN = process.env.ASTRA_TOKEN;

const ASTRA_URL = `https://${ASTRA_DB_ID}-${ASTRA_REGION}.apps.astra.datastax.com/api/rest/v2/keyspaces/${ASTRA_KEYSPACE}`;

/* =====================
   🧪 TEST ROUTE
===================== */
app.get("/", (req, res) => {
  res.send("Astra DB backend running ✅");
});

/* =====================
   ➕ ADD HOSPITAL
===================== */
app.post("/api/hospitals", async (req, res) => {
  try {
    const hospital = {
      id: crypto.randomUUID(),

      // ✅ column names EXACT as Astra DB
      hospitalname: req.body.hospitalName,
      country: req.body.country,
      state: req.body.state,
      district: req.body.district,
      address: req.body.address,
      contact: req.body.contact,
      email: req.body.email,
      photo: req.body.photo || "",

      verified: false,
      bloodstock: JSON.stringify(req.body.bloodStock),
      lastupdated: new Date().toISOString().slice(0, 10)
    };

    await axios.post(
      `${ASTRA_URL}/hospitals`,
      hospital,
      {
        headers: {
          "X-Cassandra-Token": ASTRA_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    res.status(201).json({
      message: "Hospital added successfully ✅",
      hospital
    });

  } catch (err) {
    console.error("ADD ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: "Add hospital failed",
      details: err.response?.data || err.message
    });
  }
});

/* =====================
   📤 GET ALL HOSPITALS
===================== */
app.get("/api/hospitals", async (req, res) => {
  try {
    const response = await axios.get(
      `${ASTRA_URL}/hospitals`,
      {
        headers: {
          "X-Cassandra-Token": ASTRA_TOKEN
        },
         params: {
          where: "{}"   // ✅ REQUIRED by Astra
        }
      }
    );

   const hospitals = response.data.data.map(h => ({
  id: h.id,
  hospitalName: h.hospitalname,
  country: h.country,
  state: h.state,
  district: h.district,
  address: h.address,
  contact: h.contact,
  email: h.email,
  photo: h.photo,
  verified: h.verified,
  bloodStock: JSON.parse(h.bloodstock),
  lastUpdated: h.lastupdated
}));


    res.json(hospitals);

  } catch (err) {
    console.error("FETCH ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Fetch failed" });
  }
});

/* =====================
   ♻ UPDATE HOSPITAL
===================== */
app.put("/api/hospitals/:id", async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      bloodStock: req.body.bloodStock
        ? JSON.stringify(req.body.bloodStock)
        : undefined,
      lastUpdated: new Date().toISOString().slice(0, 10)
    };

    await axios.put(
      `${ASTRA_URL}/hospitals/${req.params.id}`,
      updateData,
      {
        headers: {
          "X-Cassandra-Token": ASTRA_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ message: "Hospital updated successfully ♻" });

  } catch (err) {
    console.error("UPDATE ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Update failed" });
  }
});

/* =====================
   🚀 START SERVER
===================== */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
