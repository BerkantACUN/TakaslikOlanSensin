/* -------------------------------------------------------------------
   Repository katmanı (Oracle raw SQL)
   Tüm veri erişim tek modülde — eski Prisma çağrılarının yerine geçer.
   Oracle, kolon adlarını VARSAYILAN olarak büyük harfle döner; her
   sorgu sonucunu manuel camelCase'e map'liyoruz.
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
  return { id: r.ID, name: r.NAME, faculty: r.FACULTY };
}

function mapUser(r: any): User | null {
  if (!r) return null;
  return {
    id: r.ID,
    username: r.USERNAME,
    email: r.EMAIL,
    avatarName: r.AVATAR_NAME ?? null,
    bio: r.BIO ?? null,
    departmentId: r.DEPARTMENT_ID ?? null,
    createdAt: r.CREATED_AT,
  };
}

function mapResource(r: any): Resource | null {
  if (!r) return null;
  return {
    id: r.ID,
    title: r.TITLE,
    type: r.TYPE,
    description: r.DESCRIPTION ?? null,
    departmentId: r.DEPARTMENT_ID ?? null,
  };
}

function mapPost(r: any): Post | null {
  if (!r) return null;
  return {
    id: r.ID,
    title: r.TITLE,
    description: r.DESCRIPTION ?? null,
    status: r.STATUS,
    ownerId: r.OWNER_ID,
    offerId: r.OFFER_ID,
    requestId: r.REQUEST_ID,
    createdAt: r.CREATED_AT,
    updatedAt: r.UPDATED_AT,
  };
}

function mapExchange(r: any): Exchange | null {
  if (!r) return null;
  return {
    id: r.ID,
    postId: r.POST_ID,
    requesterId: r.REQUESTER_ID,
    status: r.STATUS,
    createdAt: r.CREATED_AT,
    updatedAt: r.UPDATED_AT,
  };
}

/* ============================================================
   DEPARTMENTS
============================================================ */
export const departments = {
  async list(): Promise<Department[]> {
    const rows = await query("SELECT id, name, faculty FROM departments ORDER BY name");
    return rows.map((r) => mapDept(r)!);
  },
};

/* ============================================================
   USERS
============================================================ */
export const users = {
  async findByEmailOrUsername(value: string): Promise<
    | (User & { passwordHash: string })
    | null
  > {
    const r: any = await queryOne(
      `SELECT id, email, username, password_hash, avatar_name, bio, department_id, created_at
       FROM users WHERE email = :v OR username = :v`,
      { v: value },
    );
    if (!r) return null;
    return { ...mapUser(r)!, passwordHash: r.PASSWORD_HASH };
  },

  async exists(opts: { email?: string; username?: string }): Promise<{
    sameEmail: boolean;
    sameUsername: boolean;
  } | null> {
    if (!opts.email && !opts.username) return null;
    const r: any = await queryOne(
      `SELECT
         MAX(CASE WHEN email = :e THEN 1 ELSE 0 END) AS same_email,
         MAX(CASE WHEN username = :u THEN 1 ELSE 0 END) AS same_username
       FROM users
       WHERE email = :e OR username = :u`,
      { e: opts.email ?? "", u: opts.username ?? "" },
    );
    if (!r) return { sameEmail: false, sameUsername: false };
    return {
      sameEmail: Number(r.SAME_EMAIL ?? 0) === 1,
      sameUsername: Number(r.SAME_USERNAME ?? 0) === 1,
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
       VALUES (:id, :email, :username, :password_hash, :avatar_name, :department_id)`,
      {
        id,
        email: data.email,
        username: data.username,
        password_hash: data.passwordHash,
        avatar_name: data.avatarName ?? data.username,
        department_id: data.departmentId ?? null,
      },
    );
    const created = await users.findById(id);
    return created!;
  },

  async findById(id: string): Promise<User | null> {
    const r = await queryOne(
      `SELECT id, email, username, avatar_name, bio, department_id, created_at
       FROM users WHERE id = :id`,
      { id },
    );
    return mapUser(r);
  },

  async findDetailed(id: string): Promise<UserDetailed | null> {
    const u: any = await queryOne(
      `SELECT u.id, u.email, u.username, u.avatar_name, u.bio, u.department_id, u.created_at,
              d.id AS d_id, d.name AS d_name, d.faculty AS d_faculty
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = :id`,
      { id },
    );
    if (!u) return null;
    const skillsRows = await query(
      `SELECT skill FROM user_skills WHERE user_id = :id ORDER BY skill`,
      { id },
    );
    return {
      ...mapUser(u)!,
      department: u.D_ID
        ? { id: u.D_ID, name: u.D_NAME, faculty: u.D_FACULTY }
        : null,
      skills: skillsRows.map((s: any) => s.SKILL),
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
    await tx(async (conn) => {
      await execNoQuery(
        conn,
        `UPDATE users
         SET avatar_name = :avatar_name,
             bio = :bio,
             department_id = :department_id,
             updated_at = SYSTIMESTAMP
         WHERE id = :id`,
        {
          id,
          avatar_name: data.avatarName ?? null,
          bio: data.bio ?? null,
          department_id: data.departmentId ?? null,
        },
      );
      if (Array.isArray(data.skills)) {
        await execNoQuery(
          conn,
          `DELETE FROM user_skills WHERE user_id = :id`,
          { id },
        );
        for (const s of data.skills) {
          await execNoQuery(
            conn,
            `INSERT INTO user_skills (user_id, skill) VALUES (:id, :s)`,
            { id, s },
          );
        }
      }
    });
  },

  async averageRating(
    userId: string,
  ): Promise<{ avg: number | null; count: number }> {
    const r: any = await queryOne(
      `SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt
       FROM reviews WHERE reviewee_id = :id`,
      { id: userId },
    );
    return {
      avg: r?.AVG_RATING != null ? Number(r.AVG_RATING) : null,
      count: Number(r?.CNT ?? 0),
    };
  },

  async reviewsReceived(userId: string, limit = 8): Promise<
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
       WHERE r.reviewee_id = :id
       ORDER BY r.created_at DESC
       FETCH FIRST :lim ROWS ONLY`,
      { id: userId, lim: limit },
    );
    return rows.map((r: any) => ({
      id: r.ID,
      exchangeId: r.EXCHANGE_ID,
      reviewerId: r.REVIEWER_ID,
      revieweeId: r.REVIEWEE_ID,
      rating: Number(r.RATING),
      comment: r.COMMENT_TEXT ?? null,
      createdAt: r.CREATED_AT,
      reviewer: { username: r.REV_USERNAME, avatarName: r.REV_AVATAR ?? null },
    }));
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
       VALUES (:id, :title, :type, :description, :department_id)`,
      {
        id,
        title: data.title,
        type: data.type,
        description: data.description ?? null,
        department_id: data.departmentId ?? null,
      },
    );
    return (await resources.findById(id))!;
  },

  async findById(id: string): Promise<Resource | null> {
    return mapResource(
      await queryOne(
        `SELECT id, title, type, description, department_id
         FROM resources WHERE id = :id`,
        { id },
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

export const posts = {
  async list(
    me: { id: string } | null,
    filters: PostListFilters = {},
  ): Promise<PostDetailed[]> {
    const conditions: string[] = ["p.status = 'ACTIVE'"];
    const binds: Record<string, unknown> = {};
    if (filters.q) {
      conditions.push(
        `(LOWER(p.title) LIKE LOWER(:q) OR LOWER(p.description) LIKE LOWER(:q)
          OR LOWER(o.title) LIKE LOWER(:q) OR LOWER(r.title) LIKE LOWER(:q))`,
      );
      binds.q = `%${filters.q}%`;
    }
    if (filters.type) {
      conditions.push("o.type = :type");
      binds.type = filters.type;
    }
    if (filters.departmentId) {
      conditions.push("u.department_id = :dept");
      binds.dept = filters.departmentId;
    }

    const orderBy =
      filters.sort === "popular"
        ? "(SELECT COUNT(*) FROM exchanges e WHERE e.post_id = p.id) DESC, p.created_at DESC"
        : "p.created_at DESC";

    const limit = filters.limit ?? 60;
    binds.lim = limit;

    const rows = await query(
      `SELECT p.id, p.title, p.description, p.status, p.owner_id, p.offer_id, p.request_id,
              p.created_at, p.updated_at,
              u.id AS u_id, u.username AS u_username, u.avatar_name AS u_avatar,
              u.email AS u_email, u.bio AS u_bio,
              u.department_id AS u_dept, u.created_at AS u_created,
              d.id AS d_id, d.name AS d_name, d.faculty AS d_faculty,
              o.id AS o_id, o.title AS o_title, o.type AS o_type,
              o.description AS o_desc, o.department_id AS o_dept,
              r.id AS r_id, r.title AS r_title, r.type AS r_type,
              r.description AS r_desc, r.department_id AS r_dept,
              CASE WHEN :meId IS NOT NULL AND
                EXISTS (SELECT 1 FROM favorites f WHERE f.user_id = :meId AND f.post_id = p.id)
                THEN 1 ELSE 0 END AS fav_flag
       FROM posts p
       JOIN users u    ON u.id  = p.owner_id
       LEFT JOIN departments d ON d.id = u.department_id
       JOIN resources o ON o.id = p.offer_id
       JOIN resources r ON r.id = p.request_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY ${orderBy}
       FETCH FIRST :lim ROWS ONLY`,
      { ...binds, meId: me?.id ?? null },
    );

    return rows.map((p: any) => buildDetailedPost(p));
  },

  async findById(
    id: string,
    me: { id: string } | null,
  ): Promise<PostDetailed | null> {
    const p: any = await queryOne(
      `SELECT p.id, p.title, p.description, p.status, p.owner_id, p.offer_id, p.request_id,
              p.created_at, p.updated_at,
              u.id AS u_id, u.username AS u_username, u.avatar_name AS u_avatar,
              u.email AS u_email, u.bio AS u_bio,
              u.department_id AS u_dept, u.created_at AS u_created,
              d.id AS d_id, d.name AS d_name, d.faculty AS d_faculty,
              o.id AS o_id, o.title AS o_title, o.type AS o_type,
              o.description AS o_desc, o.department_id AS o_dept,
              r.id AS r_id, r.title AS r_title, r.type AS r_type,
              r.description AS r_desc, r.department_id AS r_dept,
              CASE WHEN :meId IS NOT NULL AND
                EXISTS (SELECT 1 FROM favorites f WHERE f.user_id = :meId AND f.post_id = p.id)
                THEN 1 ELSE 0 END AS fav_flag
       FROM posts p
       JOIN users u    ON u.id  = p.owner_id
       LEFT JOIN departments d ON d.id = u.department_id
       JOIN resources o ON o.id = p.offer_id
       JOIN resources r ON r.id = p.request_id
       WHERE p.id = :id`,
      { id, meId: me?.id ?? null },
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
    await tx(async (conn) => {
      await execNoQuery(
        conn,
        `INSERT INTO resources (id, title, type, description, department_id)
         VALUES (:id, :title, :type, :description, :department_id)`,
        {
          id: offerId,
          title: data.offer.title,
          type: data.offer.type,
          description: data.offer.description ?? null,
          department_id: data.offer.departmentId ?? null,
        },
      );
      await execNoQuery(
        conn,
        `INSERT INTO resources (id, title, type, description, department_id)
         VALUES (:id, :title, :type, :description, :department_id)`,
        {
          id: requestId,
          title: data.request.title,
          type: data.request.type,
          description: data.request.description ?? null,
          department_id: data.request.departmentId ?? null,
        },
      );
      await execNoQuery(
        conn,
        `INSERT INTO posts (id, title, description, status, owner_id, offer_id, request_id)
         VALUES (:id, :title, :description, 'ACTIVE', :owner_id, :offer_id, :request_id)`,
        {
          id,
          title: data.title,
          description: data.description ?? null,
          owner_id: data.ownerId,
          offer_id: offerId,
          request_id: requestId,
        },
      );
    });
    return mapPost(
      await queryOne(
        `SELECT id, title, description, status, owner_id, offer_id, request_id, created_at, updated_at
         FROM posts WHERE id = :id`,
        { id },
      ),
    )!;
  },

  async delete(id: string, ownerId: string): Promise<boolean> {
    const n = await execute(
      `DELETE FROM posts WHERE id = :id AND owner_id = :owner_id`,
      { id, owner_id: ownerId },
    );
    return n > 0;
  },

  async byOwner(
    ownerId: string,
    me: { id: string } | null,
    limit = 12,
  ): Promise<PostDetailed[]> {
    const rows = await query(
      `SELECT p.id, p.title, p.description, p.status, p.owner_id, p.offer_id, p.request_id,
              p.created_at, p.updated_at,
              u.id AS u_id, u.username AS u_username, u.avatar_name AS u_avatar,
              u.email AS u_email, u.bio AS u_bio,
              u.department_id AS u_dept, u.created_at AS u_created,
              d.id AS d_id, d.name AS d_name, d.faculty AS d_faculty,
              o.id AS o_id, o.title AS o_title, o.type AS o_type,
              o.description AS o_desc, o.department_id AS o_dept,
              r.id AS r_id, r.title AS r_title, r.type AS r_type,
              r.description AS r_desc, r.department_id AS r_dept,
              CASE WHEN :meId IS NOT NULL AND
                EXISTS (SELECT 1 FROM favorites f WHERE f.user_id = :meId AND f.post_id = p.id)
                THEN 1 ELSE 0 END AS fav_flag
       FROM posts p
       JOIN users u    ON u.id  = p.owner_id
       LEFT JOIN departments d ON d.id = u.department_id
       JOIN resources o ON o.id = p.offer_id
       JOIN resources r ON r.id = p.request_id
       WHERE p.owner_id = :owner AND p.status = 'ACTIVE'
       ORDER BY p.created_at DESC
       FETCH FIRST :lim ROWS ONLY`,
      { owner: ownerId, meId: me?.id ?? null, lim: limit },
    );
    return rows.map((p: any) => buildDetailedPost(p));
  },
};

function buildDetailedPost(p: any): PostDetailed {
  return {
    id: p.ID,
    title: p.TITLE,
    description: p.DESCRIPTION ?? null,
    status: p.STATUS,
    ownerId: p.OWNER_ID,
    offerId: p.OFFER_ID,
    requestId: p.REQUEST_ID,
    createdAt: p.CREATED_AT,
    updatedAt: p.UPDATED_AT,
    owner: {
      id: p.U_ID,
      username: p.U_USERNAME,
      email: p.U_EMAIL,
      avatarName: p.U_AVATAR ?? null,
      bio: p.U_BIO ?? null,
      departmentId: p.U_DEPT ?? null,
      createdAt: p.U_CREATED,
      department: p.D_ID
        ? { id: p.D_ID, name: p.D_NAME, faculty: p.D_FACULTY }
        : null,
    },
    offer: {
      id: p.O_ID,
      title: p.O_TITLE,
      type: p.O_TYPE,
      description: p.O_DESC ?? null,
      departmentId: p.O_DEPT ?? null,
    },
    request: {
      id: p.R_ID,
      title: p.R_TITLE,
      type: p.R_TYPE,
      description: p.R_DESC ?? null,
      departmentId: p.R_DEPT ?? null,
    },
    favoritedByMe: Number(p.FAV_FLAG ?? 0) === 1,
  };
}

/* ============================================================
   FAVORITES
============================================================ */
export const favorites = {
  async add(userId: string, postId: string): Promise<void> {
    await execute(
      `MERGE INTO favorites f
       USING (SELECT :user_id AS user_id, :post_id AS post_id FROM dual) src
         ON (f.user_id = src.user_id AND f.post_id = src.post_id)
       WHEN NOT MATCHED THEN
         INSERT (user_id, post_id) VALUES (src.user_id, src.post_id)`,
      { user_id: userId, post_id: postId },
    );
  },

  async remove(userId: string, postId: string): Promise<void> {
    await execute(
      `DELETE FROM favorites WHERE user_id = :usrId AND post_id = :pid`,
      { usrId: userId, pid: postId },
    );
  },

  async listForUser(userId: string): Promise<PostDetailed[]> {
    const rows = await query(
      `SELECT p.id, p.title, p.description, p.status, p.owner_id, p.offer_id, p.request_id,
              p.created_at, p.updated_at,
              u.id AS u_id, u.username AS u_username, u.avatar_name AS u_avatar,
              u.email AS u_email, u.bio AS u_bio,
              u.department_id AS u_dept, u.created_at AS u_created,
              d.id AS d_id, d.name AS d_name, d.faculty AS d_faculty,
              o.id AS o_id, o.title AS o_title, o.type AS o_type,
              o.description AS o_desc, o.department_id AS o_dept,
              r.id AS r_id, r.title AS r_title, r.type AS r_type,
              r.description AS r_desc, r.department_id AS r_dept,
              1 AS fav_flag
       FROM favorites f
       JOIN posts p ON p.id = f.post_id
       JOIN users u ON u.id = p.owner_id
       LEFT JOIN departments d ON d.id = u.department_id
       JOIN resources o ON o.id = p.offer_id
       JOIN resources r ON r.id = p.request_id
       WHERE f.user_id = :usrId
       ORDER BY f.added_at DESC`,
      { usrId: userId },
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
         FROM exchanges WHERE post_id = :pid AND requester_id = :rid`,
        { pid: postId, rid: requesterId },
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
        myReviewExists?: boolean;
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
       WHERE e.id = :id`,
      { id },
    );
    if (!p) return null;

    const msgs = await query(
      `SELECT exchange_id, message_no, sender_id, content, created_at
       FROM exchange_messages
       WHERE exchange_id = :id
       ORDER BY message_no ASC`,
      { id },
    );

    return {
      id: p.ID,
      postId: p.POST_ID,
      requesterId: p.REQUESTER_ID,
      status: p.STATUS,
      createdAt: p.CREATED_AT,
      updatedAt: p.UPDATED_AT,
      post: {
        id: p.P_ID,
        title: p.P_TITLE,
        description: p.P_DESC ?? null,
        status: p.P_STATUS,
        ownerId: p.P_OWNER,
        offerId: p.P_OFFER,
        requestId: p.P_REQUEST,
        createdAt: p.P_CREATED,
        updatedAt: p.P_UPDATED,
        owner: {
          id: p.P_OWNER,
          username: p.O_USERNAME,
          avatarName: p.O_AVATAR ?? null,
        },
        offer: { title: p.OFR_TITLE, type: p.OFR_TYPE },
        request: { title: p.RQR_TITLE, type: p.RQR_TYPE },
      },
      requester: {
        id: p.REQUESTER_ID,
        username: p.REQ_USERNAME,
        avatarName: p.REQ_AVATAR ?? null,
      },
      messages: msgs.map((m: any) => ({
        exchangeId: m.EXCHANGE_ID,
        messageNo: Number(m.MESSAGE_NO),
        senderId: m.SENDER_ID,
        content: m.CONTENT,
        createdAt: m.CREATED_AT,
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
       WHERE p.owner_id = :usrId
       ORDER BY e.created_at DESC`,
      { usrId: userId },
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
       WHERE e.requester_id = :usrId
       ORDER BY e.created_at DESC`,
      { usrId: userId },
    );
  },

  async create(postId: string, requesterId: string): Promise<Exchange> {
    const id = cuid("exch_");
    await execute(
      `INSERT INTO exchanges (id, post_id, requester_id, status)
       VALUES (:id, :post_id, :requester_id, 'PENDING')`,
      { id, post_id: postId, requester_id: requesterId },
    );
    return mapExchange(
      await queryOne(
        `SELECT id, post_id, requester_id, status, created_at, updated_at
         FROM exchanges WHERE id = :id`,
        { id },
      ),
    )!;
  },

  async accept(id: string, ownerId: string): Promise<Exchange | null> {
    return tx(async (conn) => {
      const ex: any = await execOne(
        conn,
        `SELECT e.id, e.status, e.post_id FROM exchanges e
         JOIN posts p ON p.id = e.post_id
         WHERE e.id = :id AND p.owner_id = :owner`,
        { id, owner: ownerId },
      );
      if (!ex || ex.STATUS !== "PENDING") return null;
      await execNoQuery(
        conn,
        `UPDATE exchanges SET status = 'ACCEPTED', updated_at = SYSTIMESTAMP WHERE id = :id`,
        { id },
      );
      await execNoQuery(
        conn,
        `UPDATE posts SET status = 'RESERVED', updated_at = SYSTIMESTAMP WHERE id = :pid`,
        { pid: ex.POST_ID },
      );
      await execNoQuery(
        conn,
        `UPDATE exchanges SET status = 'REJECTED', updated_at = SYSTIMESTAMP
         WHERE post_id = :pid AND status = 'PENDING' AND id <> :id`,
        { pid: ex.POST_ID, id },
      );
      return mapExchange(
        await execOne(
          conn,
          `SELECT id, post_id, requester_id, status, created_at, updated_at
           FROM exchanges WHERE id = :id`,
          { id },
        ),
      );
    });
  },

  async reject(id: string, ownerId: string): Promise<boolean> {
    const n = await execute(
      `UPDATE exchanges SET status = 'REJECTED', updated_at = SYSTIMESTAMP
       WHERE id = :id AND status = 'PENDING'
         AND post_id IN (SELECT id FROM posts WHERE owner_id = :owner)`,
      { id, owner: ownerId },
    );
    return n > 0;
  },

  async cancel(id: string, userId: string): Promise<boolean> {
    return tx(async (conn) => {
      const ex: any = await execOne(
        conn,
        `SELECT e.id, e.status, e.post_id, e.requester_id, p.owner_id
         FROM exchanges e JOIN posts p ON p.id = e.post_id
         WHERE e.id = :id`,
        { id },
      );
      if (!ex) return false;
      if (ex.REQUESTER_ID !== userId && ex.OWNER_ID !== userId) return false;
      if (!["PENDING", "ACCEPTED"].includes(ex.STATUS)) return false;
      await execNoQuery(
        conn,
        `UPDATE exchanges SET status='CANCELLED', updated_at=SYSTIMESTAMP WHERE id=:id`,
        { id },
      );
      if (ex.STATUS === "ACCEPTED") {
        await execNoQuery(
          conn,
          `UPDATE posts SET status='ACTIVE', updated_at=SYSTIMESTAMP WHERE id=:pid`,
          { pid: ex.POST_ID },
        );
      }
      return true;
    });
  },

  async complete(id: string, userId: string): Promise<boolean> {
    return tx(async (conn) => {
      const ex: any = await execOne(
        conn,
        `SELECT e.id, e.status, e.post_id, e.requester_id, p.owner_id
         FROM exchanges e JOIN posts p ON p.id = e.post_id
         WHERE e.id = :id`,
        { id },
      );
      if (!ex) return false;
      if (ex.REQUESTER_ID !== userId && ex.OWNER_ID !== userId) return false;
      if (ex.STATUS !== "ACCEPTED") return false;
      await execNoQuery(
        conn,
        `UPDATE exchanges SET status='COMPLETED', updated_at=SYSTIMESTAMP WHERE id=:id`,
        { id },
      );
      await execNoQuery(
        conn,
        `UPDATE posts SET status='COMPLETED', updated_at=SYSTIMESTAMP WHERE id=:pid`,
        { pid: ex.POST_ID },
      );
      return true;
    });
  },

  async listMessages(exchangeId: string): Promise<ExchangeMessage[]> {
    const rows = await query(
      `SELECT exchange_id, message_no, sender_id, content, created_at
       FROM exchange_messages WHERE exchange_id = :id ORDER BY message_no ASC`,
      { id: exchangeId },
    );
    return rows.map((m: any) => ({
      exchangeId: m.EXCHANGE_ID,
      messageNo: Number(m.MESSAGE_NO),
      senderId: m.SENDER_ID,
      content: m.CONTENT,
      createdAt: m.CREATED_AT,
    }));
  },

  async addMessage(
    exchangeId: string,
    senderId: string,
    content: string,
  ): Promise<ExchangeMessage> {
    return tx(async (conn) => {
      const r: any = await execOne(
        conn,
        `SELECT NVL(MAX(message_no),0) + 1 AS next_no
         FROM exchange_messages WHERE exchange_id = :id`,
        { id: exchangeId },
      );
      const nextNo = Number(r?.NEXT_NO ?? 1);
      await execNoQuery(
        conn,
        `INSERT INTO exchange_messages (exchange_id, message_no, sender_id, content)
         VALUES (:eid, :no, :sndr, :content)`,
        { eid: exchangeId, no: nextNo, sndr: senderId, content },
      );
      await execNoQuery(
        conn,
        `UPDATE exchanges SET updated_at = SYSTIMESTAMP WHERE id = :id`,
        { id: exchangeId },
      );
      const m: any = await execOne(
        conn,
        `SELECT exchange_id, message_no, sender_id, content, created_at
         FROM exchange_messages WHERE exchange_id = :id AND message_no = :no`,
        { id: exchangeId, no: nextNo },
      );
      return {
        exchangeId: m.EXCHANGE_ID,
        messageNo: Number(m.MESSAGE_NO),
        senderId: m.SENDER_ID,
        content: m.CONTENT,
        createdAt: m.CREATED_AT,
      };
    });
  },

  async addReview(
    exchangeId: string,
    reviewerId: string,
    rating: number,
    comment?: string | null,
  ): Promise<{ ok: boolean; error?: string }> {
    return tx(async (conn) => {
      const ex: any = await execOne(
        conn,
        `SELECT e.id, e.status, e.requester_id, p.owner_id
         FROM exchanges e JOIN posts p ON p.id = e.post_id
         WHERE e.id = :id`,
        { id: exchangeId },
      );
      if (!ex) return { ok: false, error: "Bulunamadı" };
      if (ex.STATUS !== "COMPLETED")
        return { ok: false, error: "Tamamlanmamış" };
      if (ex.REQUESTER_ID !== reviewerId && ex.OWNER_ID !== reviewerId)
        return { ok: false, error: "Yetkisiz" };
      const revieweeId =
        reviewerId === ex.REQUESTER_ID ? ex.OWNER_ID : ex.REQUESTER_ID;

      const existing: any = await execOne(
        conn,
        `SELECT id FROM reviews WHERE exchange_id = :eid AND reviewer_id = :rid`,
        { eid: exchangeId, rid: reviewerId },
      );
      if (existing) return { ok: false, error: "Zaten değerlendirdin" };

      await execNoQuery(
        conn,
        `INSERT INTO reviews (id, exchange_id, reviewer_id, reviewee_id, rating, comment_text)
         VALUES (:id, :eid, :rid, :vid, :rating, :comment)`,
        {
          id: cuid("rev_"),
          eid: exchangeId,
          rid: reviewerId,
          vid: revieweeId,
          rating,
          comment: comment ?? null,
        },
      );
      return { ok: true };
    });
  },

  async myReviewExists(exchangeId: string, reviewerId: string): Promise<boolean> {
    const r = await queryOne(
      `SELECT 1 AS x FROM reviews WHERE exchange_id = :eid AND reviewer_id = :rid`,
      { eid: exchangeId, rid: reviewerId },
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
                ORDER BY created_at DESC FETCH FIRST 1 ROWS ONLY) AS last_content,
              (SELECT sender_id FROM direct_messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC FETCH FIRST 1 ROWS ONLY) AS last_sender
       FROM conversations c
       JOIN users ua ON ua.id = c.user_a_id
       JOIN users ub ON ub.id = c.user_b_id
       WHERE c.user_a_id = :usrId OR c.user_b_id = :usrId
       ORDER BY c.last_message_at DESC`,
      { usrId: userId },
    );
  },

  async getOrCreate(meId: string, otherId: string): Promise<Conversation> {
    const [a, b] = meId < otherId ? [meId, otherId] : [otherId, meId];
    return tx(async (conn) => {
      const existing: any = await execOne(
        conn,
        `SELECT id, user_a_id, user_b_id, last_message_at
         FROM conversations WHERE user_a_id = :a AND user_b_id = :b`,
        { a, b },
      );
      if (existing) {
        return {
          id: existing.ID,
          userAId: existing.USER_A_ID,
          userBId: existing.USER_B_ID,
          lastMessageAt: existing.LAST_MESSAGE_AT,
        };
      }
      const id = cuid("conv_");
      await execNoQuery(
        conn,
        `INSERT INTO conversations (id, user_a_id, user_b_id)
         VALUES (:id, :a, :b)`,
        { id, a, b },
      );
      const created: any = await execOne(
        conn,
        `SELECT id, user_a_id, user_b_id, last_message_at FROM conversations WHERE id = :id`,
        { id },
      );
      return {
        id: created.ID,
        userAId: created.USER_A_ID,
        userBId: created.USER_B_ID,
        lastMessageAt: created.LAST_MESSAGE_AT,
      };
    });
  },

  async findById(id: string): Promise<Conversation | null> {
    const r: any = await queryOne(
      `SELECT id, user_a_id, user_b_id, last_message_at FROM conversations WHERE id = :id`,
      { id },
    );
    if (!r) return null;
    return {
      id: r.ID,
      userAId: r.USER_A_ID,
      userBId: r.USER_B_ID,
      lastMessageAt: r.LAST_MESSAGE_AT,
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
       WHERE c.id = :id`,
      { id },
    );
    if (!r) return null;
    return {
      id: r.ID,
      userAId: r.USER_A_ID,
      userBId: r.USER_B_ID,
      lastMessageAt: r.LAST_MESSAGE_AT,
      userA: { id: r.USER_A_ID, username: r.A_USERNAME, avatarName: r.A_AVATAR ?? null },
      userB: { id: r.USER_B_ID, username: r.B_USERNAME, avatarName: r.B_AVATAR ?? null },
    };
  },

  async listMessages(conversationId: string): Promise<DirectMessage[]> {
    const rows = await query(
      `SELECT id, conversation_id, sender_id, content, created_at
       FROM direct_messages WHERE conversation_id = :id ORDER BY created_at ASC`,
      { id: conversationId },
    );
    return rows.map((m: any) => ({
      id: m.ID,
      conversationId: m.CONVERSATION_ID,
      senderId: m.SENDER_ID,
      content: m.CONTENT,
      createdAt: m.CREATED_AT,
    }));
  },

  async addMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<DirectMessage> {
    const id = cuid("dm_");
    await tx(async (conn) => {
      await execNoQuery(
        conn,
        `INSERT INTO direct_messages (id, conversation_id, sender_id, content)
         VALUES (:id, :cid, :sndr, :content)`,
        { id, cid: conversationId, sndr: senderId, content },
      );
      await execNoQuery(
        conn,
        `UPDATE conversations SET last_message_at = SYSTIMESTAMP WHERE id = :id`,
        { id: conversationId },
      );
    });
    const r: any = await queryOne(
      `SELECT id, conversation_id, sender_id, content, created_at
       FROM direct_messages WHERE id = :id`,
      { id },
    );
    return {
      id: r.ID,
      conversationId: r.CONVERSATION_ID,
      senderId: r.SENDER_ID,
      content: r.CONTENT,
      createdAt: r.CREATED_AT,
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
       VALUES (:id, :rep, :ru, :tt, :tid, :reason, :details)`,
      {
        id: cuid("rep_"),
        rep: data.reporterId,
        ru: data.reportedUserId ?? null,
        tt: data.targetType,
        tid: data.targetId,
        reason: data.reason,
        details: data.details ?? null,
      },
    );
  },
};

/* ============================================================
   STATS (landing page)
============================================================ */
export const stats = {
  async counts(): Promise<{ posts: number; users: number; completed: number }> {
    const r: any = await queryOne(
      `SELECT
         (SELECT COUNT(*) FROM posts WHERE status='ACTIVE') AS posts_count,
         (SELECT COUNT(*) FROM users) AS users_count,
         (SELECT COUNT(*) FROM exchanges WHERE status='COMPLETED') AS completed_count
       FROM dual`,
    );
    return {
      posts: Number(r?.POSTS_COUNT ?? 0),
      users: Number(r?.USERS_COUNT ?? 0),
      completed: Number(r?.COMPLETED_COUNT ?? 0),
    };
  },
};
