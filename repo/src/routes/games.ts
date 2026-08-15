import type { FastifyInstance } from "fastify";
import type { ProblemDetails } from "../types.js";
import { shuffleBoard, tryMove, isSolved } from "../utils/game.js";

export async function gamesRoutes(fastify: FastifyInstance) {

  // POST /games - start a new game
  fastify.post<{
    Body: { difficulty?: "easy" | "medium" | "hard" };
    Reply: {
      statusCode: number;
      gameId: string;
      board: number[];
      difficulty: string;
      startTime: string;
    };
  }>(
    "/games",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            difficulty: {
              type: "string",
              enum: ["easy", "medium", "hard"],
              default: "medium",
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              statusCode: { type: "number", const: 201 },
              gameId: { type: "string", format: "uuid" },
              board: {
                type: "array",
                items: { type: "integer" },
                minItems: 16,
              },
              difficulty: { type: "string" },
              startTime: { type: "string", format: "date-time" },
            },
          },
        },
      },
      preHandler: [(fastify as any).jwtAuth!.verifyJwt],
    },
    async (request, reply) => {
      const { difficulty = "medium" } = request.body;
      const { default: crypto } = await import("node:crypto");

      const gameId = crypto.randomUUID();
      const userId = request.user.userId;
      const board = shuffleBoard(200);

      fastify.stmts!.createGame.run(
        gameId,
        userId,
        JSON.stringify(board),
        0,
        0,
        0,
        difficulty,
      );

      reply.status(201);
      return {
        statusCode: 201,
        gameId,
        board,
        difficulty,
        startTime: new Date().toISOString(),
      };
    },
  );

  // GET /games/:gameId - get game state
  fastify.get<{
    Params: { gameId: string };
    Reply: {
      statusCode: number;
      id: string;
      userId: string;
      board: number[];
      moves: number;
      elapsedSeconds: number;
      solved: boolean;
      difficulty: string;
      createdAt: string;
      updatedAt: string;
    };
  }>(
    "/games/:gameId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            gameId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              statusCode: { type: "number", const: 200 },
              id: { type: "string", format: "uuid" },
              userId: { type: "string", format: "uuid" },
              board: { type: "array", items: { type: "integer" } },
              moves: { type: "integer" },
              elapsedSeconds: { type: "integer" },
              solved: { type: "boolean" },
              difficulty: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: {
            type: "object",
            properties: {
              type: { type: "string" },
              title: { type: "string" },
              status: { type: "number" },
              detail: { type: "string" },
              instance: { type: "string" },
            },
          },
        },
      },
      preHandler: [(fastify as any).jwtAuth!.verifyJwt],
    },
    async (request, reply) => {
      const { gameId } = request.params;

      const game = fastify.stmts!.getGame.get(gameId) as any;
      if (!game) {
        reply.status(404);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-404-not-found",
          title: "Not Found",
          status: 404,
          detail: "Game not found",
          instance: request.url,
        } satisfies ProblemDetails;
      }

      // Verify ownership
      if (game.user_id !== request.user.userId) {
        reply.status(404);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-404-not-found",
          title: "Not Found",
          status: 404,
          detail: "Game not found",
          instance: request.url,
        } satisfies ProblemDetails;
      }

      reply.status(200);
      return {
        statusCode: 200,
        id: game.id,
        userId: game.user_id,
        board: JSON.parse(game.board),
        moves: game.moves,
        elapsedSeconds: game.elapsed_seconds,
        solved: game.solved === 1,
        difficulty: game.difficulty,
        createdAt: game.created_at,
        updatedAt: game.updated_at,
      };
    },
  );

  // POST /games/:gameId/moves - submit a move
  fastify.post<{
    Params: { gameId: string };
    Body: { tileIndex: number };
    Reply: {
      statusCode: number;
      gameId: string;
      board: number[];
      moves: number;
      solved: boolean;
      elapsedTime: number;
      formattedTime: string;
    };
  }>(
    "/games/:gameId/moves",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            gameId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["tileIndex"],
          properties: {
            tileIndex: { type: "integer", minimum: 0, maximum: 15 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              statusCode: { type: "number", const: 200 },
              gameId: { type: "string", format: "uuid" },
              board: { type: "array", items: { type: "integer" } },
              moves: { type: "integer" },
              solved: { type: "boolean" },
              elapsedTime: { type: "number" },
              formattedTime: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              type: { type: "string" },
              title: { type: "string" },
              status: { type: "number" },
              detail: { type: "string" },
              instance: { type: "string" },
            },
          },
        },
      },
      preHandler: [(fastify as any).jwtAuth!.verifyJwt],
    },
    async (request, reply) => {
      const { gameId } = request.params;
      const { tileIndex } = request.body;
      const userId = request.user.userId;

      const game = fastify.stmts!.getGame.get(gameId) as any;
      if (!game) {
        reply.status(404);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-404-not-found",
          title: "Not Found",
          status: 404,
          detail: "Game not found",
          instance: request.url,
        } satisfies ProblemDetails;
      }

      if (game.user_id !== userId) {
        reply.status(404);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-404-not-found",
          title: "Not Found",
          status: 404,
          detail: "Game not found",
          instance: request.url,
        } satisfies ProblemDetails;
      }

      // Check if already solved
      if (game.solved === 1) {
        reply.status(400);
        return {
          type: "https://httpwg.org/specs/rfc7807.html",
          title: "Bad Request",
          status: 400,
          detail: "Game already solved",
          instance: request.url,
        } satisfies ProblemDetails;
      }

      const board = JSON.parse(game.board) as number[];
      const newBoard = tryMove(board, tileIndex);

      if (!newBoard) {
        reply.status(400);
        return {
          type: "https://httpwg.org/specs/rfc7807.html",
          title: "Bad Request",
          status: 400,
          detail: "Invalid move: tile not adjacent to empty space",
          instance: request.url,
        } satisfies ProblemDetails;
      }

      const newMoves = game.moves + 1;
      const solved = isSolved(newBoard);

      // Calculate elapsed time
      const startTime = new Date(game.created_at).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

      fastify.stmts!.updateGame.run(
        JSON.stringify(newBoard),
        newMoves,
        elapsedSeconds,
        solved ? 1 : 0,
        gameId,
        userId,
      );

      const formattedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

      const result = {
        statusCode: 200,
        gameId,
        board: newBoard,
        moves: newMoves,
        solved,
        elapsedTime: elapsedSeconds,
        formattedTime,
      };

      // If solved, create a score record
      if (solved) {
        const { default: crypto } = await import("node:crypto");
        fastify.stmts!.createScore.run(
          crypto.randomUUID(),
          userId,
          elapsedSeconds,
          newMoves,
        );
      }

      reply.status(200);
      return result;
    },
  );

  // GET /games/leaderboard - get top scores
  fastify.get<{
    Reply: {
      statusCode: number;
      data: Array<{
        rank: number;
        userId: string;
        username: string;
        gameDuration: number;
        moveCount: number;
        createdAt: string;
      }>;
    };
  }>(
    "/games/leaderboard",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              statusCode: { type: "number", const: 200 },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    rank: { type: "integer" },
                    userId: { type: "string", format: "uuid" },
                    username: { type: "string" },
                    gameDuration: { type: "integer" },
                    moveCount: { type: "integer" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
      preHandler: [(fastify as any).jwtAuth!.verifyJwt],
    },
    async (_request, reply) => {
      try {
        const topScores = fastify.stmts!.getTopScores.all(
          10,
        ) as any[];

        const data = topScores.map((s: any, i: number) => ({
          rank: i + 1,
          userId: s.user_id,
          username: s.username,
          gameDuration: s.game_duration,
          moveCount: s.move_count,
          createdAt: s.created_at,
        }));

        reply.status(200);
        return {
          statusCode: 200,
          data,
        };
      } catch (err: any) {
        fastify.log.error({ err }, "Leaderboard error");
        reply.status(500);
        return {
          type: "https://httpwg.org/specs/rfc7807.html",
          title: "Internal Server Error",
          status: 500,
          detail: err.message,
        };
      }
    },
  );
}
