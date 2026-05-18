import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from '@clerk/nextjs/server'

const f = createUploadthing();

const handleAuth = () => {
  const userId = auth();
  if (!userId) throw new Error("Unauthorized");
  return { userId : userId };
}

export const ourFileRouter = {
  serverImage: f({ image: { maxFileSize: "16MB", maxFileCount: 1 }})
    .middleware(() => handleAuth())
    .onUploadComplete(() => { console.log("serverImage uploaded") }),
  messageFile: f({ image: { maxFileSize: "16MB"}, pdf:{ maxFileSize: "32MB"}})
    .middleware(() => handleAuth())
    .onUploadComplete(() => { console.log("messageFile uploaded")}),
  postFile: f({ image: { maxFileSize: "16MB"}, pdf:{ maxFileSize: "32MB"}})
    .middleware(() => handleAuth())
    .onUploadComplete(() => { console.log("postFile uploaded")})
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
