import { IRecipeRepository, DatabaseConfig } from "./types";
import { FirebaseRepository } from "./FirebaseRepository";

export * from "./types";
export { FirebaseRepository } from "./FirebaseRepository";

// Singleton instance
let repositoryInstance: IRecipeRepository | null = null;

/**
 * Initialize the repository with Firebase configuration.
 * Call this at app startup.
 */
export function initializeRepository(
  config: DatabaseConfig,
): IRecipeRepository {
  repositoryInstance = createRepository(config);
  return repositoryInstance;
}

/**
 * Factory function to create the Firebase repository.
 *
 * Usage:
 * const repo = createRepository({
 *   provider: 'firebase',
 *   firebaseConfig: {...}
 * });
 */
export function createRepository(config: DatabaseConfig): IRecipeRepository {
  if (config.provider !== "firebase") {
    throw new Error("Only Firebase repository is supported");
  }
  if (!config.firebaseConfig) {
    throw new Error("Firebase config is required");
  }
  return new FirebaseRepository(config.firebaseConfig);
}

export function getRepository(): IRecipeRepository {
  if (!repositoryInstance) {
    throw new Error(
      "Repository not initialized. Call initializeRepository() first.",
    );
  }
  return repositoryInstance;
}

/**
 * Get current database provider type
 */
export function getCurrentProvider(): "firebase" {
  return "firebase";
}
