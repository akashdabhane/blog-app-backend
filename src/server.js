import { app } from "./app.js";
import dotenv from "dotenv"

dotenv.config({ path: "./.env" });

app.on("error", (error) => {
    console.log('error', error);
    throw error
})

app.listen(process.env.PORT || 8000, () => {
    console.log(`server is running of port ${process.env.PORT || 8000}`);
})