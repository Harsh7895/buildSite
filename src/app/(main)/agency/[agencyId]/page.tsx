const Page = async ({ params }: { params: { agencyId: string } }) => {
  const { agencyId } =  params; 

  return <div>{agencyId}</div>;
};

export default Page;
