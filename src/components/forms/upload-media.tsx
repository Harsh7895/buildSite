'use client'
import { useToast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { createMedia, saveActivityLogsNotification } from '@/lib/queries'
import { Input } from '../ui/input'
import FileUpload from '../global/file.upload'
import { Button } from '../ui/button'


const FormSchema = z.object({
  link:z.string().min(1 , {message:"Media file is required"})  ,
  name:z.string().min(1 , {message: "Name is required"})
})
const UploadMediaForm = ({subaccountId}:{subaccountId:string}) => {
    const {toast} = useToast()
    const router = useRouter()
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver:zodResolver(FormSchema),
        mode:'onSubmit',
        defaultValues:{
            link:"",
            name:""
        }
    })

    async function onSubmit(values:z.infer<typeof FormSchema>){
        try {
            const response = await createMedia(subaccountId , values );
            await saveActivityLogsNotification({
                agencyId:undefined,
                description:`Uploaded a media file | ${response.name}`,
                subaccountId,
            })

            toast({title:"Success" , description:"Uploaded media"})
            router.refresh()
        } catch (error) {
            console.log(error)
            toast({
                variant:'destructive',
                title:"Failed",
                description:"Could not uploaded media"
            })
        }
    }
  return (
   <Card className='w-full'>
        <CardHeader>
            <CardTitle>Media Information</CardTitle>
            <CardDescription>Please enter the details for your file</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({field})=>(
                            <FormItem className='flex-1'>
                                <FormLabel>File Name</FormLabel>
                                <FormControl>
                                    <Input placeholder='Your agency name' {...field}/>
                                </FormControl>
                            </FormItem>
                        )}
                    >

                    </FormField>
                    <FormField
                        control={form.control}
                        name='link'
                        render={({field})=>(
                            <FormItem>
                                <FormLabel>Media File</FormLabel>
                                <FormControl>
                                    <FileUpload
                                        apiEndpoint='subaccountLogo'
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    >
                    </FormField>

                    <Button type='submit' className='mt-4'>Upload Media</Button>
                </form>
            </Form>
        </CardContent>
   </Card>
  )
}

export default UploadMediaForm
