import {GoogleGenerativeAI} from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
})

export const aiSummariseCommit = async (diff:string) => {
    //https://github.com/docker/gen-ai/commit/<commithash>.diff
    const response = await model.generateContent([
        `You are an expert programmer, and you are trying to summarise a git diff.
        Reminders about the git diff format:
        For every file, there are a few metadata lines, like (for example):
        \`\`\`
        diff --git a/<path> b/<path>
        index <hash>..<hash>
        --- a/lib/index.js
        +++ b/lib/index.js
        \`\`\`
        This means that \`lib/index.js\` has changed. Note that this is only an example.
        Then there is a specifier of the lines that were modified.
        A line starting with  \`+\` means it was added.
        A line starting with \`-\` means it was deleted.
        A line starting with neither \`+\` nor \`-\` is code given for context and better understanding.
        It is not part of the diff.
        [...]
        EXAMPLE SUMMARY COMMENTS:
        \`\`\`
        - Raised the amount of returned recordings from \`10\` to \`15\` [packages/server/recordings.ts], [packages/server/constants.ts]
        - Fixed a typo in the github action name [.github/workflows/ci.yml]
        - Moved the \`octokit\` initialization to a separate file [packages/server/octokit.ts]
        - Added an OpenAI API for completions [packages/server/openai.ts]
        - Lowered numeric tolerance for text files
        \`\`\`
        Most commits will have less comments than this example list.
        The last comment does not include any file names because there were more than two relevant files in the hypothetical commit.
        Do not include parts of the example in your summary. It is given only as an example of appropirate comments.`,
        `Please summarise the following git diff: \n\n${diff}`,
    ])

    return response.response.text();
}