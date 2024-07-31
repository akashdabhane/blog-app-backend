import { app } from "./app.js";
import dotenv from "dotenv"
import { connectDB } from "./database/connection.js";

dotenv.config({ path: "./.env" });

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log('error', error);
            throw error
        })

        app.listen(process.env.PORT || 8000, () => {
            console.log(`server is running of port ${process.env.PORT || 8000}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!!", err)
    })