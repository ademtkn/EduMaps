import { removeFixtureSchools } from "./fixtures/schools";

/** Removes the sample schools again, together with everything the tests attached to them. */
export default async function globalTeardown() {
  await removeFixtureSchools();
}
