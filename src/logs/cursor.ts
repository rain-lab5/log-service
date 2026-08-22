import { time } from "node:console";

type Cursor = {
    timestamp : string;
    id: string;
};
//--- Since it should point to the last row ---//

export function encodeCursor(cursor : Cursor) : string
{
    return Buffer.from(JSON.stringify(cursor),"utf-8").toString("base64url");
}

export function decodeCursor(value : string) : Cursor
{
    let decoded : unknown;
    try
    {
        decoded = JSON.parse(Buffer.from(value,"base64url").toString("utf8"));

    }catch
    {
        throw new Error("[!] Invalid Cursor");
    }

    if(
        typeof decoded !=="object" ||
        decoded === null ||
        typeof (decoded as {timestamp?:unknown}).timestamp!=="string"||
        typeof (decoded as {id?:unknown}).id !=="string"
    ){
        throw new Error("[!] Invaid cursor");
    }
    const cursor = decoded as Cursor;
    const timestamp = new Date(cursor.timestamp);
    if(Number.isNaN(timestamp.getTime()) ||!/^\d+$/.test(cursor.id))
        {
            throw new Error("[!] Invaid cursor");
        } 

    return cursor;

}

