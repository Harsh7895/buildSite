const Page = async ({ params }: { params: { agencyId: string } }) => {
  const { agencyId } = await params; 

  return <div>{agencyId}</div>;
};

export default Page;
