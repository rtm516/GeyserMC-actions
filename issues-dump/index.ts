import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

async function addComment(client: InstanceType<typeof GitHub>, issue: number, body: string): Promise<void> {
	await client.rest.issues.createComment({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: issue,
		body: body
	});
}

async function run(): Promise<void> {
    try {
        const token = core.getInput('token');
		const client = github.getOctokit(token);

		const { owner, repo } = github.context.repo;
		const { issue, comment } = github.context.payload; // https://developer.github.com/v3/activity/events/types/#issuesevent

		if (!issue) { return }
		
		await addComment(client, issue.number, JSON.stringify({
			owner,
			repo,
			issue: issue,
			comment: comment
		}, null, 2));        
    } catch (error: any) {
        console.log(error.message);
        core.setFailed(error.message);
    }
}

run();