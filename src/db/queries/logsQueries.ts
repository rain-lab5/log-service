import { db } from "..";
import { logs,NewLog } from "../schema/logs";


export async function insertLogs(logsArray : NewLog[])
{
    await db.insert(logs).values(logsArray);
}

