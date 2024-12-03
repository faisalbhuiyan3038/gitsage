import {GithubRepoLoader} from '@langchain/community/document_loaders/web/github'

export const loadGithubRepo = async (githubUrl: string, githubToken?:string) => {
    const Loader = new GithubRepoLoader(githubUrl, {
        accessToken: githubToken || '',
        branch: 'main',
        ignoreFiles: ['**/node_modules/**', '**/dist/**', '**/build/**', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'],
        recursive: true,
        unknown: 'warn',
        maxConcurrency: 5
})
    const docs = await Loader.load()
    return docs
}