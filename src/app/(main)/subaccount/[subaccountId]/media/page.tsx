import BlurPage from '@/components/global/blur-page'
import MediaComponent from '@/components/media'
import { getMedia } from '@/lib/queries'
import React from 'react'

type Props = {
    params:{subaccountId:string}
}

const MediaPage = async({params}:Props) => {
    const {subaccountId} =  params
    const data = await getMedia(subaccountId)
  return (
    <BlurPage>
        <MediaComponent
         data = {data}
         subaccountId={subaccountId}
        >

        </MediaComponent>
    </BlurPage>
  )
}

export default MediaPage
