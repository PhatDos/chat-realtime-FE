import { redirect } from "next/navigation";
import { initialProfile } from "@/lib/intial-profile";

const SetupPage = async () => {
  await initialProfile();

  return redirect("/newsfeed");
};

export default SetupPage;
