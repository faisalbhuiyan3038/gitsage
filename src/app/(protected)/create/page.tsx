'use client'
import React from 'react'
import { useForm } from 'react-hook-form'

type formInput = {
    repoUrl: string,
    projectName: string,
    githubToken?: string
}

export const CreatePage = () => {
    const { register, handleSubmit, reset } = useForm<formInput>()
  return (
    <div className='flex items-center gap-12 h-full justify-center'>
        <img 
          src='/backgrounds/create-bg-4.png' 
          className='fixed left-1/2 md:left-[55%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-auto opacity-70'
          alt="Background graphic"
        />
    </div>
  )
}

export default CreatePage
