import client from "./client";

export const getLists = () => client.get("/lists");

export const createList = (name: string) =>
  client.post("/lists", { name });

export const deleteList = (id: number) =>
  client.delete(`/lists/${id}`);