import * as core from "@actions/core";
import * as github from "@actions/github";

type DeploymentState =
  | "error"
  | "failure"
  | "inactive"
  | "in_progress"
  | "queued"
  | "pending"
  | "success";

async function run() {
  try {
    const context = github.context;
    const defaultUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;

    const token = core.getInput("token", { required: true });
    const url = core.getInput("target_url", { required: false }) || defaultUrl;
    const inputRef = core.getInput("ref");
    const environment =
      core.getInput("environment", { required: false }) || "production";
    const description = core.getInput("description", { required: false });
    const initialStatus =
      (core.getInput("initial_status", {
        required: false
      }) as DeploymentState) || "pending";

    const client = new github.GitHub(token);

    console.log(context.payload.pull_request.head.ref);

    const deployment = await client.repos.createDeployment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: context.payload.pull_request.head.ref,
      required_contexts: [],
      environment,
      transient_environment: true,
      description
    });

    console.log(deployment);

    await client.repos.createDeploymentStatus({
      ...context.repo,
      deployment_id: deployment.data.id,
      state: initialStatus,
      log_url: defaultUrl,
      target_url: url
    });

    core.setOutput("deployment_id", deployment.data.id.toString());
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
