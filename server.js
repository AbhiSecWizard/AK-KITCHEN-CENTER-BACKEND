require("dotenv/config");

const express = require("express");
const cors = require("cors");

const contactRoutes = require("./src/routes/contactRoute");

const app = express();

const port = process.env.PORT || 5000;

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("COMPANY_EMAIL:", process.env.COMPANY_EMAIL);

app.use(cors({
  origin:"*"
}))

app.use(express.json());

app.use("/api/contact", contactRoutes);

app.listen(port, () => {
  console.log(`Your server is running on port ${port}`);
});
