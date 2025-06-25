import express from "express";
import bodyParser from "body-parser";
import titleRoute from "./routes/title.js";
import keywordsRoute from "./routes/keywords.js";
import tagsRoute from "./routes/tags.js";
import descriptionRoute from "./routes/description.js";
import generateRoute from "./routes/generate.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use("/title", titleRoute);
app.use("/description", descriptionRoute);
app.use("/keywords", keywordsRoute);
app.use("/tags", tagsRoute);
app.use("/generate", generateRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
