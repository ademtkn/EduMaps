import { createFixtureSchools } from "./fixtures/schools";

/** Creates the sample schools the browser tests rely on. */
export default async function globalSetup() {
  await createFixtureSchools();
}
