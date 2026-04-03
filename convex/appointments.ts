import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const getAvailableSlots = query({
  args: {
    barbershopId: v.id('barbershops'),
    barberId: v.id('barbers'),
    date: v.string(),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Get existing appointments for this barber on this date
    const existing = await ctx.db
      .query('appointments')
      .withIndex('by_barber', (q) => q.eq('barberId', args.barberId))
      .filter((q) =>
        q.and(
          q.eq(q.field('date'), args.date),
          q.neq(q.field('status'), 'cancelled'),
        ),
      )
      .collect()

    // Generate slots from 09:00 to 19:00
    const slots: string[] = []
    const startHour = 9
    const endHour = 19
    const intervalMinutes = 30

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += intervalMinutes) {
        const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        const slotEndMinutes = h * 60 + m + args.durationMinutes
        const slotEndH = Math.floor(slotEndMinutes / 60)
        const slotEndM = slotEndMinutes % 60
        if (slotEndH > endHour) break
        const slotEnd = `${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}`

        // Check for conflicts
        const hasConflict = existing.some((appt) => {
          const apptStart = appt.startTime
          const apptEnd = appt.endTime
          return slotStart < apptEnd && slotEnd > apptStart
        })

        if (!hasConflict) slots.push(slotStart)
      }
    }

    return slots
  },
})

export const create = mutation({
  args: {
    customerId: v.id('users'),
    barbershopId: v.id('barbershops'),
    barberId: v.id('barbers'),
    serviceIds: v.array(v.id('services')),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    totalPrice: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('appointments', {
      ...args,
      status: 'pending',
      createdAt: Date.now(),
    })
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id('appointments'),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('completed'),
      v.literal('cancelled'),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { status: args.status })
  },
})

export const listByCustomer = query({
  args: { customerId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('appointments')
      .withIndex('by_customer', (q) => q.eq('customerId', args.customerId))
      .order('desc')
      .collect()
  },
})

export const listByShop = query({
  args: {
    barbershopId: v.id('barbershops'),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let appts = await ctx.db
      .query('appointments')
      .withIndex('by_shop', (q) => q.eq('barbershopId', args.barbershopId))
      .order('desc')
      .collect()

    if (args.date) {
      appts = appts.filter((a) => a.date === args.date)
    }
    return appts
  },
})

export const listByBarber = query({
  args: { barberId: v.id('barbers'), date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let appts = await ctx.db
      .query('appointments')
      .withIndex('by_barber', (q) => q.eq('barberId', args.barberId))
      .order('desc')
      .collect()

    if (args.date) {
      appts = appts.filter((a) => a.date === args.date)
    }
    return appts
  },
})

export const getById = query({
  args: { id: v.id('appointments') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})
