import React from 'react'

type Props = {
    params:{subaccountId:string}
}

const SubAccountIdPage = async({params}:Props) => {
    const {subaccountId} =  params
  return (
    <div>
      {subaccountId}
    </div>
  )
}

export default SubAccountIdPage
