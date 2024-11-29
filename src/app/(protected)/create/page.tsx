'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useRefetch from '@/hooks/use-refetch'
import { api } from '@/trpc/react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type FormInput = {
  repoUrl: string,
  projectName: string,
  githubToken?: string
}

export const CreatePage = () => {
  const { register, handleSubmit, reset } = useForm<FormInput>()
  const createProject = api.project.createProject.useMutation()
  const refetch = useRefetch()

  function onSubmit(data: FormInput) {
    createProject.mutate({
      name: data.projectName,
      githubUrl: data.repoUrl,
      githubToken: data.githubToken
    }, {
      onSuccess: () => {
        toast.success('Project created successfully')
        refetch()
        reset()
      },
      onError: () => {
        toast.error('Error creating project')
      }
    })
    return true;
  }

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <div className='flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12 max-w-3xl w-full'>
        <img
          src='/backgrounds/create-bg-4.png'
          className='w-auto h-40 md:h-56 opacity-70'
          alt="Background graphic"
        />
        <div className='w-full max-w-md space-y-6'>
          <div className='space-y-2'>
            <h1 className='font-semibold text-2xl'>Link your Github Repository</h1>
            <p className='text-sm text-muted-foreground'>Enter the link of your repository to link it to GitSage.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
            <Input {...register('projectName', { required: true })} placeholder='Project Name' required />
            <Input {...register('repoUrl', { required: true })} placeholder='Github URL' required type='url' />
            <Input {...register('githubToken')} placeholder='Github Token (Optional)' />
            <Button type='submit' disabled={createProject.isPending} className='w-full'>Create Project</Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreatePage
