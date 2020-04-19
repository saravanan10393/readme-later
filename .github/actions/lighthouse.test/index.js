const core = require('@actions/core');
const exec = require('@actions/exec');
const artifact = require('@actions/artifact');
const artifactClient = artifact.create()


const url = core.getInput("url", { required: true });

core.startGroup("starting lighthouse audit");

let myOutput = '';
let myError = '';

const options = {};
options.listeners = {
  stdout: (data) => {
    myOutput += data.toString();
  },
  stderr: (data) => {
    myError += data.toString();
  }
};

exec(`npx lighthouse ${url} --verbose --output html --output-path ./report.html`, options)

core.debug(myOutput);
core.warning(myError);

core.info("completed audit");

core.info("uploading artifact");
const artifactName = 'lighthouse-result';
const rootDirectory = '.'
const files = [
  'report.html'
]
const options = {
  continueOnError: false
}
const uploadResponse = await artifactClient.uploadArtifact(artifactName, files, rootDirectory, options)
core.info("done uploading artifact")

core.setOutput("metrics", myOutput);

core.endGroup();