import {db} from "@/server/db"
import {Octokit} from "octokit";

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

const githubUrl = 'https://github.com/faisalbhuiyan3038/mpv';

type Response = {
    commitHash: string,
    commitMessage: string,
    commitDate: string,
    commitAuthorName: string,
    commitAuthorAvatar: string
}

export const getCommitHashes = async (githubUrl: string) : Promise<Response[]> => {
    const {data} = await octokit.rest.repos.listCommits({
        owner: 'faisalbhuiyan3038',
        repo: 'mpv'
    });

    const sortedCommits = data.sort((a: any, b: any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()) as any[]

    return sortedCommits.slice(0, 15).map((commit: any) => ({
        commitHash: commit.sha,
        commitMessage: commit.commit.message ?? "",
        commitDate: commit.commit?.author?.date ?? "",
        commitAuthorName: commit.commit?.author?.name ?? "",
        commitAuthorAvatar: commit?.avatar?.avatar_url ?? ""
    }))

}

export const pollCommits = async (projectId: string) => {
    const {project, githubUrl} = await fetchProjectGithubUrl(projectId)
    const commitHashes = await getCommitHashes(githubUrl!);
    const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes);
    return unprocessedCommits
}

async function fetchProjectGithubUrl(projectId: string) {
    const project = await db.project.findUnique({
        where: {id: projectId},
        select: {
            githubUrl: true
        }
    })
    return { project, githubUrl: project?.githubUrl }
}

async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]){
    const processedCommits = await db.commit.findMany({
        where: {projectId}
    })

    const unprocessedCommits = commitHashes.filter(commit => !processedCommits.find(processedCommit => processedCommit.commitHash === commit.commitHash))
    return unprocessedCommits
}

await pollCommits('cm42wr5op0000qs9zeo8w4jj4')