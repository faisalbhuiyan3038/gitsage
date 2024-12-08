import { db } from "@/server/db"
import { Octokit } from "octokit";
import axios from "axios";
import { aiSummariseCommit } from "./gemini";

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

type Response = {
    commitHash: string,
    commitMessage: string,
    commitAuthorName: string,
    commitAuthorAvatar: string,
    commitDate: string,
}

export const getCommitHashes = async (githubUrl: string): Promise<Response[]> => {
    const [owner, repo] = githubUrl.split('/').slice(-2);

    if (!owner || !repo){
        throw new Error('Invalid github url');
    }

    const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo
    });

    const sortedCommits = data.sort((a: any, b: any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()) as any[]

    return sortedCommits.slice(0, 15).map((commit: any) => ({
        commitHash: commit.sha as string,
        commitMessage: commit.commit.message ?? "",
        commitDate: commit.commit?.author?.date ?? "",
        commitAuthorName: commit.commit?.author?.name ?? "",
        commitAuthorAvatar: commit?.author?.avatar_url ?? ""
    }))

}

export const pollCommits = async (projectId: string) => {
    const { project, githubUrl } = await fetchProjectGithubUrl(projectId)
    const commitHashes = await getCommitHashes(githubUrl!);
    const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes);

    console.log(`Processing ${unprocessedCommits.length} unprocessed commits`);

    const summaryResponses = await Promise.allSettled(unprocessedCommits.map(commit => {
        return summariseCommit(githubUrl, commit.commitHash)
    }))

    const summaries = summaryResponses.map((response, idx) => {
        if (response.status === 'fulfilled') {
            if (!response.value) {
                console.error(`Empty summary returned for commit ${unprocessedCommits[idx]?.commitHash}`);
            }
            return response.value as string;
        }
        console.error(`Failed to get summary for commit ${unprocessedCommits[idx]?.commitHash}:`, response.reason);
        return '';
    });

    console.log(`Got ${summaries.filter(s => s).length} successful summaries out of ${summaries.length} total`);

    const commits = await db.commit.createMany({
        data: summaries.map((summary, index) => {
            const commit = unprocessedCommits[index]!;
            console.log(`Saving commit ${commit.commitHash} with summary length: ${summary?.length || 0}`);
            return {
                projectId,
                commitHash: commit.commitHash,
                commitMessage: commit.commitMessage,
                commitAuthorName: commit.commitAuthorName,
                commitAuthorAvatar: commit.commitAuthorAvatar,
                commitDate: commit.commitDate,
                summary
            }
        })
    })

    return commits
}

async function summariseCommit(githubUrl: string, commitHash: string) {
    try {
        // get the diff, then pass it to ai
        const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
            headers: {
                Accept: 'application/vnd.github.v3.diff'
            }
        });

        if (!data) {
            console.error(`No diff data received for commit ${commitHash}`);
            return "";
        }

        console.log(`Got diff for commit ${commitHash}, length: ${data.length}`);
        const summary = await aiSummariseCommit(data);

        if (!summary) {
            console.error(`AI returned empty summary for commit ${commitHash}`);
        }

        return summary || "";
    } catch (error) {
        console.error(`Error getting summary for commit ${commitHash}:`, error);
        return "";
    }
}

async function fetchProjectGithubUrl(projectId: string) {
        const project = await db.project.findUnique({
            where: { id: projectId },
            select: {
                githubUrl: true
            }
        })
        if(!project?.githubUrl){
            throw new Error('Project has no github url')
        }
        return { project, githubUrl: project?.githubUrl }
}

async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]) {
        const processedCommits = await db.commit.findMany({
            where: { projectId }
        })

        const unprocessedCommits = commitHashes.filter((commit) => !processedCommits.some((processedCommit) => processedCommit.commitHash === commit.commitHash))
        return unprocessedCommits
}
