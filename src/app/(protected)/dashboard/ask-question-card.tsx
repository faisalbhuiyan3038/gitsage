'use client'
import MDEditor from '@uiw/react-md-editor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import useProject from '@/hooks/use-project'
import React from 'react'
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'
import { askQuestion } from './actions'
import { string } from 'zod'
import { readStreamableValue } from 'ai/rsc'
import CodeReferences from './code-references'
import { api } from '@/trpc/react'
import { toast } from 'sonner'

const AskQuestionCard = () => {
    const {project} = useProject()
    const [open, setOpen] = React.useState(false)
    const [question, setQuestion] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [fileReferences, setFileReferences] = React.useState<{fileName: string; sourceCode: string; summary: string}[]>([])
    const [answer, setAnswer] = React.useState('')
    const saveAnswer = api.project.saveAnswer.useMutation()

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setAnswer('')
    setFileReferences([])
        e.preventDefault()
        if(!project?.id) return
        setLoading(true)
        

        const {output, fileReferences} = await askQuestion(question, project.id)
        setOpen(true)
        setFileReferences(fileReferences)

        for await (const delta of readStreamableValue(output)) {
            if(delta){
                setAnswer((ans) => ans + delta)
            }
        }
        setLoading(false)
    }

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[80vw]">
        <DialogHeader>
            <div className="flex items-center gap-2">
            </div>
            <DialogTitle>
                <Image src="/logo.png" width={40} height={40} alt="gitSage" />
            </DialogTitle>
            <Button disabled={saveAnswer.isPending} variant="outline" onClick={() => {saveAnswer.mutate({projectId: project!.id, question, answer, fileReferences}, {
                onSuccess: () => {
                    toast.success('Answer saved successfully')
                },
                onError: () => {
                    toast.error('Error saving answer')
                }
            })}}>
                Save Answer
            </Button>
        </DialogHeader>
        <MDEditor.Markdown source={answer} className="max-w-[70vw] !h-full max-h-[40vh] overflow-scroll"/>
        <div className="h-4"></div>
        <CodeReferences fileReferences={fileReferences} />
        
        <Button type="button" onClick={() => {setOpen(false)}}>
        Close
        </Button>
        </DialogContent>

    </Dialog>
    <Card className='relative col-span-3 '>
        <CardHeader>
            <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={onSubmit}>
                <Textarea placeholder='Which file should I edit to change the home page?' />
                <div className="h-4"></div>
                <Button type="submit" disabled={loading}>
                    Ask GitSage!
                </Button>
            </form>
        </CardContent>
    </Card>
    </>
  )
}

export default AskQuestionCard