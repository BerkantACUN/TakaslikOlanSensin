/* -------------------------------------------------------------------
   Repository katmanı — PostgreSQL (Supabase) raw SQL
   Postgres kolon adlarını küçük harfle döndürür; $1/$2 positional bind.
------------------------------------------------------------------- */

import {
  cuid,
  execMany,
  execNoQuery,
  execOne,
  execute,
  query,
  queryOne,
  tx,
} from "./db";
import type {
  Conversation,
  Department,
  DirectMessage,
  Exchange,
  ExchangeMessage,
  Post,
  PostDetailed,
  Resource,
  Review,
  User,
  UserDetailed,
} from "./types";

/* ----------------------------- helpers ----------------------------- */

function mapDept(r: any): Department | null {
  if (!r) return null;
  return { id: r.id, name: r.name, faculty: r.faculty };
}

function mapUser(r: any): User | null {
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    avatarName: r.avatar_name ?? null,
    bio: r.bio ?? null,
    departmentId: r.department_id ?? null,
    createdAt: r.created_at,
  };
}

function mapResource(r: any): Resource | null {
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    description: r.description ?? null,
    departmentId: r.department_id ?? null,
  };
}

function mapPost(r: any): Post | null {
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    status: r.status,
    ownerId: r.owner_id,
    offerId: r.offer_id,
    requestId: r.request_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapExchange(r: any): Exchange | null {
  if (!r) return null;
  return {
    id: r.id,
    postId: r.post_id,
    requesterId: r.requester_id,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ============================================================
   DEPARTMENTS
============================================================ */
export const departments = {
  async list(): Promise<Department[]> {
    const rows = await query(
      "SELECT id, name, faculty FROM departments ORDER BY name",
    );
    return rows.map((r) => mapDept(r)!);
  },
};

/* ============================================================
   USERS
============================================================ */
export const users = {
  async findByEmailOrUsername(
    value: string,
  ): Promise<(User & { passwordHash: string }) | null> {
    const r: any = await queryOne(
      `SELECT id, email, username, password_hash, avatar_name, bio, department_id, created_at
       FROM users WHERE email = $1 OR username = $1`,
      [value],
    );
    if (!r) return null;
    return { ...mapUser(r)!, passwordHash: r.password_hash };
  },

  async exists(opts: { email?: string; username?: string }): Promise<{
    sameEmail: boolean;
    sameUsername: boolean;
  } | null> {
    if (!opts.email && !opts.username) return null;
    const r: any = await queryOne(
      `SELECT
         BOOL_OR(email = $1)    AS same_email,
         BOOL_OR(username = $2) AS same_username
       FROM users
       WHERE email = $1 OR username = $2`,
      [opts.email ?? "", opts.username ?? ""],
    );
    return {
      sameEmail: !!r?.same_email,
      sameUsername: !!r?.same_username,
    };
  },

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
    avatarName?: string | null;
    departmentId?: string | null;
  }): Promise<User> {
    const id = cuid("user_");
    await execute(
      `INSERT INTO users (id, email, username, password_hash, avatar_name, department_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        data.email,
        data.username,
        data.passwordHash,
        data.avatarName ?? data.username,
        data.departmentId ?? null,
      ],
    );
    return (await users.findById(id))!;
  },

  async findById(id: string): Promise<User | null> {
    return mapUser(
      await queryOne(
        `SELECT id, email, username, avatar_name, bio, department_id, created_at
         FROM users WHERE id = $1`,
        [id],
      ),
    );
  },

  async findDetailed(id: string): Promise<UserDetailed | null> {
    const u: any = await queryOne(
      `SELECT u.id, u.email, u.username, u.avatar_name, u.bio, u.department_id, u.created_at,
              d.id AS d_id, d.name AS d_name, d.faculty AS d_faculty
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = $1`,
      [id],
    );
    if (!u) return null;
    const skillsRows = await query(
      `SELECT skill FROM user_skills WHERE user_id = $1 ORDER BY skill`,
      [id],
    );
    return {
      ...mapUser(u)!,
      department: u.d_id
        ? { id: u.d_id, name: u.d_name, faculty: u.d_faculty }
        : null,
      skills: skillsRows.map((s: any) => s.skill),
    };
  },

  async updateProfile(
    id: string,
    data: {
      avatarName?: string | null;
      bio?: string | null;
      departmentId?: string | null;
      skills?: string[];
    },
  ): Promise<void> {
    await tx(async (client) => {
      await execNoQuery(
        client,
        `UPDATE users
         SET avatar_name = $1, bio = $2, department_id = $3, updated_at = NOW()
         WHERE id = $4`,
        [
          data.avatarName ?? null,
          data.bio ?? null,
          data.departmentId ?? null,
          id,
        ],
      );
      if (Array.isArray(data.skills)) {
        await execNoQuery(
          client,
          `DELETE FROM user_skills WHERE user_id = $1`,
          [id],
        );
        for (const s of data.skills) {
          await execNoQuery(
            client,
            `INSERT INTO user_skills (user_id, skill) VALUES ($1, $2)`,
            [id, s],
          );
        }
      }
    });
  },

  async averageRating(
    userId: string,
  ): Promise<{ avg: number | null; count: number }> {
    const r: any = await queryOne(
      `SELECT AVG(rating)::float AS avg_rating, COUNT(*) AS cnt
       FROM reviews WHERE reviewee_id = $1`,
      [userId],
    );
    return {
      avg: r?.avg_rating != null ? Number(r.avg_rating) : null,
      count: Number(r?.cnt ?? 0),
    };
  },

  async reviewsReceived(
    userId: string,
    limit = 8,
  ): Promise<
    Array<
      Review & {
        reviewer: { username: string; avatarName: string | null };
      }
    >
  > {
    const rows = await query(
      `SELECT r.*, u.username AS rev_username, u.avatar_name AS rev_avatar
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return rows.map((r: any) => ({
      id: r.id,
      exchangeId: r.exchange_id,
      reviewerId: r.reviewer_id,
      revieweeId: r.reviewee_id,
      rating: Number(r.rating),
      comment: r.comment_text ?? null,
      createdAt: r.created_at,
      reviewer: { username: r.rev_username, avatarName: r.rev_avatar ?? null },
    }));
  },

  async deleteAccount(id: string): Promise<boolean> {
    const n = await execute(`DELETE FROM users WHERE id = $1`, [id]);
    return n > 0;
  },
};

/* ============================================================
   RESOURCES
============================================================ */
export const resources = {
  async create(data: {
    title: string;
    type: string;
    description?: string | null;
    departmentId?: string | null;
  }): Promise<Resource> {
    const id = cuid("res_");
    await execute(
      `INSERT INTO resources (id, title, type, description, department_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        id,
        data.title,
        data.type,
        data.description ?? null,
        data.departmentId ?? null,
      ],
    );
    return (await resources.findById(id))!;
  },

  async findById(id: string): Promise<Resource | null> {
    return mapResource(
      await queryOne(
        `SELECT id, title, type, description, department_id
         FROM resources WHERE id = $1`,
        [id],
      ),
    );
  },
};

/* ============================================================
   POSTS
============================================================ */
export interface PostListFilters {
  q?: string;
  type?: string;
  departmentId?: string;
  sort?: "new" | "popular";
  limit?: number;
}

const POST_SELECT = `
  p.id, p.title, p.description, p.status, p.owner_id, p.offer_id, p.request_id,
  p.created_at, p.updated_at,
  u.id AS u_id, u.username AS u_username, u.avatar_name AS u_avatar,
  u.email AS u_email, u.bio AS u_bio,
  u.department_id AS u_dept, u.created_at AS u_created,
  d.id AS d_id, d.name AS d_name, d.faculty AS d_faculty,
  o.id AS o_id, o.title AS o_title, o.type AS o_type,
  o.description AS o_desc, o.department_id AS o_dept,
  r.id AS r_id, r.title AS r_title, r.type AS r_type,
  r.description AS r_desc, r.department_id AS r_dept
`;

const POST_JOINS = `
  FROM posts p
  JOIN users u    ON u.id  = p.owner_id
  LEFT JOIN departments d ON d.id = u.department_id
  JOIN resources o ON o.id = p.offer_id
  JOIN resources r ON r.id = p.request_id
`;

function favFlagExpr(paramIndex: number): string {
  return `CASE WHEN $${paramIndex}::text IS NOT NULL AND EXISTS (
    SELECT 1 FROM favorites f WHERE f.user_id = $${paramIndex} AND f.post_id = p.id
  ) THEN 1 ELSE 0 END AS fav_flag`;
}

export const posts = {
  async list(
    me: { id: string } | null,
    filters: PostListFilters = {},
  ): Promise<PostDetailed[]> {
    const conditions: string[] = [`p.status = 'ACTIVE'`];
    const params: unknown[] = [];
    let idx = 1;

    // me ID ilk param
    params.push(me?.id ?? null);
    const meIdx = idx++;

    if (filters.q) {
      params.push(`%${filters.q}%`);
      conditions.push(
        `(p.title ILIKE $${idx} OR p.description ILIKE $${idx} OR o.title ILIKE $${idx} OR r.title ILIKE $${idx})`,
      );
      idx++;
    }
    if (filters.type) {
      params.push(filters.type);
      conditions.push(`o.type = $${idx++}`);
    }
    if (filters.departmentId) {
      params.push(filters.departmentId);
      conditions.push(`u.department_id = $${idx++}`);
    }

    const orderBy =
      filters.sort === "popular"
        ? "(SELECT COUNT(*) FROM exchanges e WHERE e.post_id = p.id) DESC, p.created_at DESC"
        : "p.created_at DESC";

    const limit = filters.limit ?? 60;
    params.push(limit);
    const limIdx = idx++;

    const sql = `SELECT ${POST_SELECT}, ${favFlagExpr(meIdx)}
                 ${POST_JOINS}
                 WHERE ${conditions.join(" AND ")}
                 ORDER BY ${orderBy}
                 LIMIT $${limIdx}`;

    const rows = await query(sql, params);
    return rows.map((p: any) => buildDetailedPost(p));
  },

  async findById(
    id: string,
    me: { id: string } | null,
  ): Promise<PostDetailed | null> {
    const p: any = await queryOne(
      `SELECT ${POST_SELECT}, ${favFlagExpr(1)}
       ${POST_JOINS}
       WHERE p.id = $2`,
      [me?.id ?? null, id],
    );
    if (!p) return null;
    return buildDetailedPost(p);
  },

  async create(data: {
    ownerId: string;
    title: string;
    description?: string | null;
    offer: {
      title: string;
      type: string;
      description?: string | null;
      departmentId?: string | null;
    };
    request: {
      title: string;
      type: string;
      description?: string | null;
      departmentId?: string | null;
    };
  }): Promise<Post> {
    const id = cuid("post_");
    const offerId = cuid("res_");
    const requestId = cuid("res_");
    await tx(async (client) => {
      await execNoQuery(
        client,
        `INSERT INTO resources (id, title, type, description, department_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          offerId,
          data.offer.title,
          data.offer.type,
          data.offer.description ?? null,
          data.offer.departmentId ?? null,
        ],
      );
      await execNoQuery(
        client,
        `INSERT INTO resources (id, title, type, description, department_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          requestId,
          data.request.title,
          data.request.type,
          data.request.description ?? null,
          data.request.departmentId ?? null,
        ],
      );
      await execNoQuery(
        client,
        `INSERT INTO posts (id, title, description, status, owner_id, offer_id, request_id)
         VALUES ($1, $2, $3, 'ACTIVE', $4, $5, $6)`,
        [
          id,
          data.title,
          data.description ?? null,
          data.ownerId,
          offerId,
          requestId,
        ],
      );
    });
    return mapPost(
      await queryOne(
        `SELECT id, title, description, status, owner_id, offer_id, request_id, created_at, updated_at
         FROM posts WHERE id = $1`,
        [id],
      ),
    )!;
  },

  async delete(id: string, ownerId: string): Promise<boolean> {
    const n = await execute(
      `DELETE FROM posts WHERE id = $1 AND owner_id = $2`,
      [id, ownerId],
    );
    return n > 0;
  },

  async byOwner(
    ownerId: string,
    me: { id: string } | null,
    limit = 12,
  ): Promise<PostDetailed[]> {
    const rows = await query(
      `SELECT ${POST_SELECT}, ${favFlagExpr(1)}
       ${POST_JOINS}
       WHERE p.owner_id = $2 AND p.status = 'ACTIVE'
       ORDER BY p.created_at DESC
       LIMIT $3`,
      [me?.id ?? null, ownerId, limit],
    );
    return rows.map((p: any) => buildDetailedPost(p));
  },
};

function buildDetailedPost(p: any): PostDetailed {
  return {
    id: p.id,
    title: p.title,
    description: p.description ?? null,
    status: p.status,
    ownerId: p.owner_id,
    offerId: p.offer_id,
    requestId: p.request_id,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    owner: {
      id: p.u_id,
      username: p.u_username,
      email: p.u_email,
      avatarName: p.u_avatar ?? null,
      bio: p.u_bio ?? null,
      departmentId: p.u_dept ?? null,
      createdAt: p.u_created,
      department: p.d_id
        ? { id: p.d_id, name: p.d_name, faculty: p.d_faculty }
        : null,
    },
    offer: {
      id: p.o_id,
      title: p.o_title,
      type: p.o_type,
      description: p.o_desc ?? null,
      departmentId: p.o_dept ?? null,
    },
    request: {
      id: p.r_id,
      title: p.r_title,
      type: p.r_type,
      description: p.r_desc ?? null,
      departmentId: p.r_dept ?? null,
    },
    favoritedByMe: Number(p.fav_flag ?? 0) === 1,
  };
}

/* ============================================================
   FAVORITES
============================================================ */
export const favorites = {
  async add(userId: string, postId: string): Promise<void> {
    await execute(
      `INSERT INTO favorites (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING`,
      [userId, postId],
    );
  },

  async remove(userId: string, postId: string): Promise<void> {
    await execute(
      `DELETE FROM favorites WHERE user_id = $1 AND post_id = $2`,
      [userId, postId],
    );
  },

  async listForUser(userId: string): Promise<PostDetailed[]> {
    const rows = await query(
      `SELECT ${POST_SELECT}, 1 AS fav_flag
       FROM favorites f
       JOIN posts p ON p.id = f.post_id
       JOIN users u ON u.id = p.owner_id
       LEFT JOIN departments d ON d.id = u.department_id
       JOIN resources o ON o.id = p.offer_id
       JOIN resources r ON r.id = p.request_id
       WHERE f.user_id = $1
       ORDER BY f.added_at DESC`,
      [userId],
    );
    return rows.map((p: any) => buildDetailedPost(p));
  },
};

/* ============================================================
   EXCHANGES
============================================================ */
export const exchanges = {
  async findForRequester(postId: string, requesterId: string) {
    return mapExchange(
      await queryOne(
        `SELECT id, post_id, requester_id, status, created_at, updated_at
         FROM exchanges WHERE post_id = $1 AND requester_id = $2`,
        [postId, requesterId],
      ),
    );
  },

  async findById(id: string): Promise<
    | (Exchange & {
        post: Post & {
          owner: { id: string; username: string; avatarName: string | null };
          offer: { title: string; type: string };
          request: { title: string; type: string };
        };
        requester: { id: string; username: string; avatarName: string | null };
        messages: ExchangeMessage[];
      })
    | null
  > {
    const p: any = await queryOne(
      `SELECT e.id, e.post_id, e.requester_id, e.status, e.created_at, e.updated_at,
              p.id AS p_id, p.title AS p_title, p.description AS p_desc, p.status AS p_status,
              p.owner_id AS p_owner, p.offer_id AS p_offer, p.request_id AS p_request,
              p.created_at AS p_created, p.updated_at AS p_updated,
              o.username AS o_username, o.avatar_name AS o_avatar,
              req.username AS req_username, req.avatar_name AS req_avatar,
              ofr.title AS ofr_title, ofr.type AS ofr_type,
              rqr.title AS rqr_title, rqr.type AS rqr_type
       FROM exchanges e
       JOIN posts p ON p.id = e.post_id
       JOIN users o ON o.id = p.owner_id
       JOIN users req ON req.id = e.requester_id
       JOIN resources ofr ON ofr.id = p.offer_id
       JOIN resources rqr ON rqr.id = p.request_id
       WHERE e.id = $1`,
      [id],
    );
    if (!p) return null;
    const msgs = await query(
      `SELECT exchange_id, message_no, sender_id, content, created_at
       FROM exchange_messages WHERE exchange_id = $1 ORDER BY message_no ASC`,
      [id],
    );
    return {
      id: p.id,
      postId: p.post_id,
      requesterId: p.requester_id,
      status: p.status,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      post: {
        id: p.p_id,
        title: p.p_title,
        description: p.p_desc ?? null,
        status: p.p_status,
        ownerId: p.p_owner,
        offerId: p.p_offer,
        requestId: p.p_request,
        createdAt: p.p_created,
        updatedAt: p.p_updated,
        owner: {
          id: p.p_owner,
          username: p.o_username,
          avatarName: p.o_avatar ?? null,
        },
        offer: { title: p.ofr_title, type: p.ofr_type },
        request: { title: p.rqr_title, type: p.rqr_type },
      },
      requester: {
        id: p.requester_id,
        username: p.req_username,
        avatarName: p.req_avatar ?? null,
      },
      messages: msgs.map((m: any) => ({
        exchangeId: m.exchange_id,
        messageNo: Number(m.message_no),
        senderId: m.sender_id,
        content: m.content,
        createdAt: m.created_at,
      })),
    };
  },

  async incoming(userId: string) {
    return query(
      `SELECT e.id, e.status, e.created_at, e.updated_at,
              p.id AS p_id, p.title AS p_title, p.status AS p_status,
              req.id AS r_id, req.username AS r_username, req.avatar_name AS r_avatar
       FROM exchanges e
       JOIN posts p ON p.id = e.post_id
       JOIN users req ON req.id = e.requester_id
       WHERE p.owner_id = $1
       ORDER BY e.created_at DESC`,
      [userId],
    );
  },

  async outgoing(userId: string) {
    return query(
      `SELECT e.id, e.status, e.created_at, e.updated_at,
              p.id AS p_id, p.title AS p_title, p.status AS p_status,
              o.id AS o_id, o.username AS o_username, o.avatar_name AS o_avatar
       FROM exchanges e
       JOIN posts p ON p.id = e.post_id
       JOIN users o ON o.id = p.owner_id
       WHERE e.requester_id = $1
       ORDER BY e.created_at DESC`,
      [userId],
    );
  },

  async create(postId: string, requesterId: string): Promise<Exchange> {
    const id = cuid("exch_");
    await execute(
      `INSERT INTO exchanges (id, post_id, requester_id, status)
       VALUES ($1, $2, $3, 'PENDING')`,
      [id, postId, requesterId],
    );
    return mapExchange(
      await queryOne(
        `SELECT id, post_id, requester_id, status, created_at, updated_at
         FROM exchanges WHERE id = $1`,
        [id],
      ),
    )!;
  },

  async accept(id: string, ownerId: string): Promise<Exchange | null> {
    return tx(async (client) => {
      const ex: any = await execOne(
        client,
        `SELECT e.id, e.status, e.post_id FROM exchanges e
         JOIN posts p ON p.id = e.post_id
         WHERE e.id = $1 AND p.owner_id = $2`,
        [id, ownerId],
      );
      if (!ex || ex.status !== "PENDING") return null;
      await execNoQuery(
        client,
        `UPDATE exchanges SET status = 'ACCEPTED', updated_at = NOW() WHERE id = $1`,
        [id],
      );
      await execNoQuery(
        client,
        `UPDATE posts SET status = 'RESERVED', updated_at = NOW() WHERE id = $1`,
        [ex.post_id],
      );
      await execNoQuery(
        client,
        `UPDATE exchanges SET status = 'REJECTED', updated_at = NOW()
         WHERE post_id = $1 AND status = 'PENDING' AND id <> $2`,
        [ex.post_id, id],
      );
      return mapExchange(
        await execOne(
          client,
          `SELECT id, post_id, requester_id, status, created_at, updated_at
           FROM exchanges WHERE id = $1`,
          [id],
        ),
      );
    });
  },

  async reject(id: string, ownerId: string): Promise<boolean> {
    const n = await execute(
      `UPDATE exchanges SET status = 'REJECTED', updated_at = NOW()
       WHERE id = $1 AND status = 'PENDING'
         AND post_id IN (SELECT id FROM posts WHERE owner_id = $2)`,
      [id, ownerId],
    );
    return n > 0;
  },

  async cancel(id: string, userId: string): Promise<boolean> {
    return tx(async (client) => {
      const ex: any = await execOne(
        client,
        `SELECT e.id, e.status, e.post_id, e.requester_id, p.owner_id
         FROM exchanges e JOIN posts p ON p.id = e.post_id
         WHERE e.id = $1`,
        [id],
      );
      if (!ex) return false;
      if (ex.requester_id !== userId && ex.owner_id !== userId) return false;
      if (!["PENDING", "ACCEPTED"].includes(ex.status)) return false;
      await execNoQuery(
        client,
        `UPDATE exchanges SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`,
        [id],
      );
      if (ex.status === "ACCEPTED") {
        await execNoQuery(
          client,
          `UPDATE posts SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1`,
          [ex.post_id],
        );
      }
      return true;
    });
  },

  async complete(id: string, userId: string): Promise<boolean> {
    return tx(async (client) => {
      const ex: any = await execOne(
        client,
        `SELECT e.id, e.status, e.post_id, e.requester_id, p.owner_id
         FROM exchanges e JOIN posts p ON p.id = e.post_id
         WHERE e.id = $1`,
        [id],
      );
      if (!ex) return false;
      if (ex.requester_id !== userId && ex.owner_id !== userId) return false;
      if (ex.status !== "ACCEPTED") return false;
      await execNoQuery(
        client,
        `UPDATE exchanges SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1`,
        [id],
      );
      await execNoQuery(
        client,
        `UPDATE posts SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1`,
        [ex.post_id],
      );
      return true;
    });
  },

  async listMessages(exchangeId: string): Promise<ExchangeMessage[]> {
    const rows = await query(
      `SELECT exchange_id, message_no, sender_id, content, created_at
       FROM exchange_messages WHERE exchange_id = $1 ORDER BY message_no ASC`,
      [exchangeId],
    );
    return rows.map((m: any) => ({
      exchangeId: m.exchange_id,
      messageNo: Number(m.message_no),
      senderId: m.sender_id,
      content: m.content,
      createdAt: m.created_at,
    }));
  },

  async addMessage(
    exchangeId: string,
    senderId: string,
    content: string,
  ): Promise<ExchangeMessage> {
    return tx(async (client) => {
      const r: any = await execOne(
        client,
        `SELECT COALESCE(MAX(message_no), 0) + 1 AS next_no
         FROM exchange_messages WHERE exchange_id = $1`,
        [exchangeId],
      );
      const nextNo = Number(r?.next_no ?? 1);
      await execNoQuery(
        client,
        `INSERT INTO exchange_messages (exchange_id, message_no, sender_id, content)
         VALUES ($1, $2, $3, $4)`,
        [exchangeId, nextNo, senderId, content],
      );
      await execNoQuery(
        client,
        `UPDATE exchanges SET updated_at = NOW() WHERE id = $1`,
        [exchangeId],
      );
      const m: any = await execOne(
        client,
        `SELECT exchange_id, message_no, sender_id, content, created_at
         FROM exchange_messages WHERE exchange_id = $1 AND message_no = $2`,
        [exchangeId, nextNo],
      );
      return {
        exchangeId: m.exchange_id,
        messageNo: Number(m.message_no),
        senderId: m.sender_id,
        content: m.content,
        createdAt: m.created_at,
      };
    });
  },

  async addReview(
    exchangeId: string,
    reviewerId: string,
    rating: number,
    comment?: string | null,
  ): Promise<{ ok: boolean; error?: string }> {
    return tx(async (client) => {
      const ex: any = await execOne(
        client,
        `SELECT e.id, e.status, e.requester_id, p.owner_id
         FROM exchanges e JOIN posts p ON p.id = e.post_id
         WHERE e.id = $1`,
        [exchangeId],
      );
      if (!ex) return { ok: false, error: "Bulunamadı" };
      if (ex.status !== "COMPLETED")
        return { ok: false, error: "Tamamlanmamış" };
      if (ex.requester_id !== reviewerId && ex.owner_id !== reviewerId)
        return { ok: false, error: "Yetkisiz" };
      const revieweeId =
        reviewerId === ex.requester_id ? ex.owner_id : ex.requester_id;

      const existing: any = await execOne(
        client,
        `SELECT id FROM reviews WHERE exchange_id = $1 AND reviewer_id = $2`,
        [exchangeId, reviewerId],
      );
      if (existing) return { ok: false, error: "Zaten değerlendirdin" };

      await execNoQuery(
        client,
        `INSERT INTO reviews (id, exchange_id, reviewer_id, reviewee_id, rating, comment_text)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          cuid("rev_"),
          exchangeId,
          reviewerId,
          revieweeId,
          rating,
          comment ?? null,
        ],
      );
      return { ok: true };
    });
  },

  async myReviewExists(
    exchangeId: string,
    reviewerId: string,
  ): Promise<boolean> {
    const r = await queryOne(
      `SELECT 1 AS x FROM reviews WHERE exchange_id = $1 AND reviewer_id = $2`,
      [exchangeId, reviewerId],
    );
    return !!r;
  },
};

/* ============================================================
   CONVERSATIONS & DM
============================================================ */
export const dm = {
  async listForUser(userId: string) {
    return query(
      `SELECT c.id, c.user_a_id, c.user_b_id, c.last_message_at,
              ua.username AS a_username, ua.avatar_name AS a_avatar,
              ub.username AS b_username, ub.avatar_name AS b_avatar,
              (SELECT content FROM direct_messages
                 WHERE conversation_id = c.id
                 ORDER BY created_at DESC LIMIT 1) AS last_content,
              (SELECT sender_id FROM direct_messages
                 WHERE conversation_id = c.id
                 ORDER BY created_at DESC LIMIT 1) AS last_sender
       FROM conversations c
       JOIN users ua ON ua.id = c.user_a_id
       JOIN users ub ON ub.id = c.user_b_id
       WHERE c.user_a_id = $1 OR c.user_b_id = $1
       ORDER BY c.last_message_at DESC`,
      [userId],
    );
  },

  async getOrCreate(meId: string, otherId: string): Promise<Conversation> {
    const [a, b] = meId < otherId ? [meId, otherId] : [otherId, meId];
    return tx(async (client) => {
      const existing: any = await execOne(
        client,
        `SELECT id, user_a_id, user_b_id, last_message_at
         FROM conversations WHERE user_a_id = $1 AND user_b_id = $2`,
        [a, b],
      );
      if (existing) {
        return {
          id: existing.id,
          userAId: existing.user_a_id,
          userBId: existing.user_b_id,
          lastMessageAt: existing.last_message_at,
        };
      }
      const id = cuid("conv_");
      await execNoQuery(
        client,
        `INSERT INTO conversations (id, user_a_id, user_b_id) VALUES ($1, $2, $3)`,
        [id, a, b],
      );
      const created: any = await execOne(
        client,
        `SELECT id, user_a_id, user_b_id, last_message_at FROM conversations WHERE id = $1`,
        [id],
      );
      return {
        id: created.id,
        userAId: created.user_a_id,
        userBId: created.user_b_id,
        lastMessageAt: created.last_message_at,
      };
    });
  },

  async findById(id: string): Promise<Conversation | null> {
    const r: any = await queryOne(
      `SELECT id, user_a_id, user_b_id, last_message_at FROM conversations WHERE id = $1`,
      [id],
    );
    if (!r) return null;
    return {
      id: r.id,
      userAId: r.user_a_id,
      userBId: r.user_b_id,
      lastMessageAt: r.last_message_at,
    };
  },

  async findByIdWithUsers(id: string) {
    const r: any = await queryOne(
      `SELECT c.id, c.user_a_id, c.user_b_id, c.last_message_at,
              ua.username AS a_username, ua.avatar_name AS a_avatar,
              ub.username AS b_username, ub.avatar_name AS b_avatar
       FROM conversations c
       JOIN users ua ON ua.id = c.user_a_id
       JOIN users ub ON ub.id = c.user_b_id
       WHERE c.id = $1`,
      [id],
    );
    if (!r) return null;
    return {
      id: r.id,
      userAId: r.user_a_id,
      userBId: r.user_b_id,
      lastMessageAt: r.last_message_at,
      userA: {
        id: r.user_a_id,
        username: r.a_username,
        avatarName: r.a_avatar ?? null,
      },
      userB: {
        id: r.user_b_id,
        username: r.b_username,
        avatarName: r.b_avatar ?? null,
      },
    };
  },

  async listMessages(conversationId: string): Promise<DirectMessage[]> {
    const rows = await query(
      `SELECT id, conversation_id, sender_id, content, created_at
       FROM direct_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId],
    );
    return rows.map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      createdAt: m.created_at,
    }));
  },

  async addMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<DirectMessage> {
    const id = cuid("dm_");
    await tx(async (client) => {
      await execNoQuery(
        client,
        `INSERT INTO direct_messages (id, conversation_id, sender_id, content)
         VALUES ($1, $2, $3, $4)`,
        [id, conversationId, senderId, content],
      );
      await execNoQuery(
        client,
        `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
        [conversationId],
      );
    });
    const r: any = await queryOne(
      `SELECT id, conversation_id, sender_id, content, created_at
       FROM direct_messages WHERE id = $1`,
      [id],
    );
    return {
      id: r.id,
      conversationId: r.conversation_id,
      senderId: r.sender_id,
      content: r.content,
      createdAt: r.created_at,
    };
  },
};

/* ============================================================
   REPORTS
============================================================ */
export const reports = {
  async create(data: {
    reporterId: string;
    reportedUserId?: string | null;
    targetType: string;
    targetId: string;
    reason: string;
    details?: string | null;
  }): Promise<void> {
    await execute(
      `INSERT INTO reports (id, reporter_id, reported_user_id, target_type, target_id, reason, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        cuid("rep_"),
        data.reporterId,
        data.reportedUserId ?? null,
        data.targetType,
        data.targetId,
        data.reason,
        data.details ?? null,
      ],
    );
  },
};

/* ============================================================
   STATS
============================================================ */
export interface DepartmentStat {
  departmentId: string;
  departmentName: string;
  faculty: string;
  postCount: number;
  userCount: number;
}

export const stats = {
  async counts(): Promise<{ posts: number; users: number; completed: number }> {
    const r: any = await queryOne(
      `SELECT
         (SELECT COUNT(*) FROM posts WHERE status='ACTIVE') AS posts_count,
         (SELECT COUNT(*) FROM users) AS users_count,
         (SELECT COUNT(*) FROM exchanges WHERE status='COMPLETED') AS completed_count`,
    );
    return {
      posts: Number(r?.posts_count ?? 0),
      users: Number(r?.users_count ?? 0),
      completed: Number(r?.completed_count ?? 0),
    };
  },

  async byDepartment(limit = 8): Promise<DepartmentStat[]> {
    const rows = await query(
      `SELECT d.id, d.name, d.faculty,
              COUNT(DISTINCT p.id) AS post_count,
              COUNT(DISTINCT u.id) AS user_count
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id
       LEFT JOIN posts p ON p.owner_id = u.id AND p.status = 'ACTIVE'
       GROUP BY d.id, d.name, d.faculty
       ORDER BY post_count DESC, user_count DESC
       LIMIT $1`,
      [limit],
    );
    return rows.map((r: any) => ({
      departmentId: r.id,
      departmentName: r.name,
      faculty: r.faculty,
      postCount: Number(r.post_count ?? 0),
      userCount: Number(r.user_count ?? 0),
    }));
  },
};
