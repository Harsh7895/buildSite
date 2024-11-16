import { SignIn } from "@clerk/nextjs";

const Page = () => {
  return (
    <div className="h-full w-full flex justify-center items-center">
      <SignIn />
    </div>
  );
};

export default Page;
