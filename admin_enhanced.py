import os
import json
import logging
from datetime import datetime, timedelta
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes, ConversationHandler

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Bot configuration
BOT_TOKEN = "7883828920:AAHY2dO0MzSY_3nBRUR2UX4JdsI4msOyfJo"
MINI_APP_URL = "https://telegram-mini-app-olive.vercel.app/"

# Admin user IDs (replace with your Telegram user ID)
ADMIN_IDS = [5660670674]  # Add your Telegram user ID here

# Data storage
USERS_FILE = "users_data.json"
CHANNELS_FILE = "channels_data.json"
ADS_FILE = "ads_data.json"
STATS_FILE = "stats_data.json"

# Conversation states
CHOOSING_ACTION, CHOOSING_AD_TYPE, ENTERING_CHANNEL_ID, ENTERING_CHANNEL_NAME, ENTERING_USER_ID, ENTERING_PHOTO, ENTERING_VIDEO = range(7)

class EnhancedAdminPanel:
    def __init__(self):
        self.users_data = self.load_data(USERS_FILE, {})
        self.channels_data = self.load_data(CHANNELS_FILE, {})
        self.ads_data = self.load_data(ADS_FILE, {})
        self.stats_data = self.load_data(STATS_FILE, {})
        
    def load_data(self, filename, default):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return default
            
    def save_data(self, filename, data):
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def is_admin(self, user_id):
        return user_id in ADMIN_IDS

    async def admin_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Start admin panel"""
        user_id = update.effective_user.id
        
        if not self.is_admin(user_id):
            if update.message:
                await update.message.reply_text("❌ Siz admin emassiz!")
            else:
                await update.callback_query.edit_message_text("❌ Siz admin emassiz!")
            return ConversationHandler.END
            
        keyboard = [
            [InlineKeyboardButton("👥 Foydalanuvchilar", callback_data="users")],
            [InlineKeyboardButton("📊 Statistika", callback_data="stats")],
            [InlineKeyboardButton("📢 Reklama yuborish", callback_data="ads")],
            [InlineKeyboardButton("📺 Kanal boshqaruvi", callback_data="channels")],
            [InlineKeyboardButton("❌ Chiqish", callback_data="exit")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        if update.message:
            await update.message.reply_text(
                "🔧 *Admin Panel*\n\nQaysi bo'limni ochmoqchisiz?",
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        else:
            await update.callback_query.edit_message_text(
                "🔧 *Admin Panel*\n\nQaysi bo'limni ochmoqchisiz?",
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        return CHOOSING_ACTION

    async def handle_admin_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle admin panel callbacks"""
        query = update.callback_query
        await query.answer()
        
        if query.data == "users":
            await self.show_users_management(update, context)
        elif query.data == "stats":
            await self.show_statistics(update, context)
        elif query.data == "ads":
            await self.show_ads_menu(update, context)
        elif query.data == "channels":
            await self.show_channels_management(update, context)
        elif query.data == "exit":
            await query.edit_message_text("👋 Admin panel yopildi")
        elif query.data == "back_to_main":
            await self.admin_start(update, context)
        elif query.data == "list_users":
            await self.list_all_users(update, context)
        elif query.data == "search_user":
            await self.search_user_prompt(update, context)
        elif query.data == "block_user":
            await self.block_user_prompt(update, context)
        elif query.data == "unblock_user":
            await self.unblock_user_prompt(update, context)
        elif query.data == "send_text_ad":
            await self.send_ad_to_all_users(update, context)
        elif query.data == "send_photo_ad":
            await self.send_photo_ad_prompt(update, context)
        elif query.data == "send_video_ad":
            await self.send_video_ad_prompt(update, context)
        elif query.data == "add_channel":
            await self.add_channel_prompt(update, context)
        elif query.data == "list_channels":
            await self.list_all_channels(update, context)
        elif query.data == "detailed_stats":
            await self.show_detailed_statistics(update, context)
        elif query.data == "chart_stats":
            await self.show_chart_statistics(update, context)
        elif query.data == "delete_channel":
            await self.delete_channel_prompt(update, context)
        elif query.data.startswith("del_channel_"):
            await self.delete_channel(update, context)
        elif query.data == "check_subscription":
            await self.handle_subscription_check(update, context)
        else:
            # Unknown callback data
            await query.answer("❌ Noma'lum buyruq")

    async def show_users_management(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show users management menu"""
        query = update.callback_query
        
        total_users = len(self.users_data)
        active_users = sum(1 for user in self.users_data.values() if user.get('last_activity', 0) > (datetime.now() - timedelta(days=7)).timestamp())
        blocked_users = sum(1 for user in self.users_data.values() if user.get('is_blocked', False))
        
        keyboard = [
            [InlineKeyboardButton("📋 Barcha foydalanuvchilar", callback_data="list_users")],
            [InlineKeyboardButton("🔍 Foydalanuvchi qidirish", callback_data="search_user")],
            [InlineKeyboardButton("🚫 Foydalanuvchini bloklash", callback_data="block_user")],
            [InlineKeyboardButton("✅ Blokni olib tashlash", callback_data="unblock_user")],
            [InlineKeyboardButton("⬅️ Orqaga", callback_data="back_to_main")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        try:
            await query.edit_message_text(
                f"👥 *Foydalanuvchilar boshqaruvi*\n\n"
                f"📊 Jami foydalanuvchilar: {total_users}\n"
                f"🟢 Faol foydalanuvchilar (7 kun): {active_users}\n"
                f"🚫 Bloklangan foydalanuvchilar: {blocked_users}\n\n"
                f"Qaysi amalni bajarishni xohlaysiz?",
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        except Exception as e:
            await query.edit_message_text(
                f"👥 Foydalanuvchilar boshqaruvi\n\n"
                f"📊 Jami foydalanuvchilar: {total_users}\n"
                f"🟢 Faol foydalanuvchilar (7 kun): {active_users}\n"
                f"🚫 Bloklangan foydalanuvchilar: {blocked_users}\n\n"
                f"Qaysi amalni bajarishni xohlaysiz?",
                reply_markup=reply_markup
            )

    async def list_all_users(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """List all users with pagination"""
        query = update.callback_query
        
        users_list = []
        for user_id, user_data in list(self.users_data.items())[:10]:  # Show first 10 users
            status = "🚫" if user_data.get('is_blocked', False) else "✅"
            username = user_data.get('username', 'N/A')
            first_name = user_data.get('first_name', 'N/A')
            created_date = datetime.fromtimestamp(user_data.get('created_at', 0)).strftime('%Y-%m-%d')
            
            users_list.append(f"{status} ID: {user_id}\n👤 {first_name} (@{username})\n📅 {created_date}\n")
        
        keyboard = [
            [InlineKeyboardButton("⬅️ Orqaga", callback_data="users")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        try:
            await query.edit_message_text(
                f"📋 *Barcha foydalanuvchilar* (1-10)\n\n" + "\n".join(users_list) + f"\n\nJami: {len(self.users_data)} foydalanuvchi",
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        except Exception as e:
            # If markdown fails, send without markdown
            await query.edit_message_text(
                f"📋 Barcha foydalanuvchilar (1-10)\n\n" + "\n".join(users_list) + f"\n\nJami: {len(self.users_data)} foydalanuvchi",
                reply_markup=reply_markup
            )
        
        return CHOOSING_ACTION

    async def search_user_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Prompt for user search"""
        query = update.callback_query
        
        await query.edit_message_text(
            "🔍 *Foydalanuvchi qidirish*\n\n"
            "Foydalanuvchi ID yoki username'ini kiriting:\n"
            "(Bekor qilish uchun /cancel yozing)",
            parse_mode=ParseMode.MARKDOWN
        )
        return ENTERING_USER_ID

    async def search_user(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Search for a specific user"""
        search_term = update.message.text
        
        if search_term == "/cancel":
            await update.message.reply_text("❌ Qidiruv bekor qilindi")
            return await self.show_users_management(update, context)
        
        found_users = []
        for user_id, user_data in self.users_data.items():
            if (search_term.lower() in str(user_id).lower() or 
                search_term.lower() in user_data.get('username', '').lower() or
                search_term.lower() in user_data.get('first_name', '').lower()):
                found_users.append((user_id, user_data))
        
        if found_users:
            result_text = "🔍 *Qidiruv natijalari:*\n\n"
            for user_id, user_data in found_users[:5]:  # Show max 5 results
                status = "🚫" if user_data.get('is_blocked', False) else "✅"
                username = user_data.get('username', 'N/A')
                first_name = user_data.get('first_name', 'N/A')
                created_date = datetime.fromtimestamp(user_data.get('created_at', 0)).strftime('%Y-%m-%d')
                
                result_text += f"{status} ID: {user_id}\n👤 {first_name} (@{username})\n📅 {created_date}\n\n"
        else:
            result_text = "❌ Foydalanuvchi topilmadi"
        
        keyboard = [
            [InlineKeyboardButton("⬅️ Orqaga", callback_data="users")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        try:
            await update.message.reply_text(
                result_text,
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
        except Exception as e:
            # If markdown fails, send without markdown
            await update.message.reply_text(
                result_text.replace('*', ''),
                reply_markup=reply_markup
            )
        
        return CHOOSING_ACTION

    async def block_user_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Prompt for blocking user"""
        query = update.callback_query
        
        await query.edit_message_text(
            "🚫 *Foydalanuvchini bloklash*\n\n"
            "Bloklash kerak bo'lgan foydalanuvchi ID'sini kiriting:\n"
            "(Bekor qilish uchun /cancel yozing)",
            parse_mode=ParseMode.MARKDOWN
        )
        return ENTERING_USER_ID

    async def block_user(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Block a specific user"""
        user_id = update.message.text
        
        if user_id == "/cancel":
            await update.message.reply_text("❌ Bloklash bekor qilindi")
            return await self.show_users_management(update, context)
        
        if user_id in self.users_data:
            self.users_data[user_id]['is_blocked'] = True
            self.save_data(USERS_FILE, self.users_data)
            
            await update.message.reply_text(f"✅ Foydalanuvchi {user_id} bloklandi")
        else:
            await update.message.reply_text("❌ Foydalanuvchi topilmadi")
        
        return await self.show_users_management(update, context)

    async def unblock_user_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Prompt for unblocking user"""
        query = update.callback_query
        
        await query.edit_message_text(
            "✅ *Blokni olib tashlash*\n\n"
            "Blokni olib tashlash kerak bo'lgan foydalanuvchi ID'sini kiriting:\n"
            "(Bekor qilish uchun /cancel yozing)",
            parse_mode=ParseMode.MARKDOWN
        )
        return ENTERING_USER_ID

    async def unblock_user(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Unblock a specific user"""
        user_id = update.message.text
        
        if user_id == "/cancel":
            await update.message.reply_text("❌ Blokni olib tashlash bekor qilindi")
            return await self.show_users_management(update, context)
        
        if user_id in self.users_data:
            self.users_data[user_id]['is_blocked'] = False
            self.save_data(USERS_FILE, self.users_data)
            
            await update.message.reply_text(f"✅ Foydalanuvchi {user_id} blokdan chiqarildi")
        else:
            await update.message.reply_text("❌ Foydalanuvchi topilmadi")
        
        return await self.show_users_management(update, context)

    async def show_statistics(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Show detailed statistics"""
        query = update.callback_query
        
        total_users = len(self.users_data)
        today = datetime.now().date()
        today_users = sum(1 for user in self.users_data.values() 
                         if datetime.fromtimestamp(user.get('created_at', 0)).date() == today)
        
        # Weekly stats
        week_ago = datetime.now() - timedelta(days=7)
        week_users = sum(1 for user in self.users_data.values() 
                        if datetime.fromtimestamp(user.get('created_at', 0)) > week_ago)
        
        # Monthly stats
        month_ago = datetime.now() - timedelta(days=30)
        month_users = sum(1 for user in self.users_data.values() 
                         if datetime.fromtimestamp(user.get('created_at', 0)) > month_ago)
        
        # Active users
        active_users = sum(1 for user in self.users_data.values() 
                          if user.get('last_activity', 0) > (datetime.now() - timedelta(days=7)).timestamp())
        
        keyboard = [
            [InlineKeyboardButton("📈 Batafsil statistika", callback_data="detailed_stats")],
            [InlineKeyboardButton("📊 Grafik ko'rinishda", callback_data="chart_stats")],
            [InlineKeyboardButton("⬅️ Orqaga", callback_data="back_to_main")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            f"📊 *Statistika*\n\n"
            f"👥 Jami foydalanuvchilar: {total_users}\n"
            f"🟢 Faol foydalanuvchilar (7 kun): {active_users}\n"
            f"📅 Bugun qo'shilgan: {today_users}\n"
            f"📈 So'nggi 7 kun: {week_users}\n"
            f"📊 So'nggi 30 kun: {month_users}\n\n"
            f"Batafsil ma'lumot uchun tugmani bosing:",
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )
        return CHOOSING_ACTION

    async def show_detailed_statistics(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Show detailed statistics"""
        query = update.callback_query
        
        # Calculate detailed stats
        total_users = len(self.users_data)
        blocked_users = sum(1 for user in self.users_data.values() if user.get('is_blocked', False))
        active_users = sum(1 for user in self.users_data.values() 
                          if user.get('last_activity', 0) > (datetime.now() - timedelta(days=7)).timestamp())
        
        # Daily stats for last 7 days
        daily_stats = []
        for i in range(7):
            date = datetime.now() - timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')
            count = sum(1 for user in self.users_data.values() 
                       if datetime.fromtimestamp(user.get('created_at', 0)).date() == date.date())
            daily_stats.append(f"📅 {date.strftime('%m-%d')}: {count}")
        
        keyboard = [
            [InlineKeyboardButton("⬅️ Orqaga", callback_data="stats")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            f"📈 *Batafsil statistika*\n\n"
            f"👥 Jami foydalanuvchilar: {total_users}\n"
            f"🟢 Faol foydalanuvchilar: {active_users}\n"
            f"🚫 Bloklangan: {blocked_users}\n"
            f"📊 Faollik foizi: {(active_users/total_users*100):.1f}%\n\n"
            f"📅 *So'nggi 7 kun:*\n" + "\n".join(daily_stats),
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )
        return CHOOSING_ACTION

    async def show_chart_statistics(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Show chart-like statistics"""
        query = update.callback_query
        
        total_users = len(self.users_data)
        active_users = sum(1 for user in self.users_data.values() 
                          if user.get('last_activity', 0) > (datetime.now() - timedelta(days=7)).timestamp())
        blocked_users = sum(1 for user in self.users_data.values() if user.get('is_blocked', False))
        
        # Create simple bar chart
        active_bar = "█" * int(active_users / max(total_users, 1) * 20)
        blocked_bar = "█" * int(blocked_users / max(total_users, 1) * 20)
        
        keyboard = [
            [InlineKeyboardButton("⬅️ Orqaga", callback_data="stats")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            f"📊 *Grafik statistika*\n\n"
            f"👥 Jami: {total_users}\n\n"
            f"🟢 Faol: {active_users}\n{active_bar}\n\n"
            f"🚫 Bloklangan: {blocked_users}\n{blocked_bar}\n\n"
            f"📈 Faollik: {(active_users/total_users*100):.1f}%",
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )
        return CHOOSING_ACTION

    async def show_ads_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Show advertising menu"""
        query = update.callback_query
        
        keyboard = [
            [InlineKeyboardButton("📢 Matn reklama", callback_data="send_text_ad")],
            [InlineKeyboardButton("🖼️ Rasm bilan reklama", callback_data="send_photo_ad")],
            [InlineKeyboardButton("🎥 Video bilan reklama", callback_data="send_video_ad")],
            [InlineKeyboardButton("⬅️ Orqaga", callback_data="back_to_main")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            "📢 *Reklama yuborish*\n\n"
            "Qaysi turdagi reklama yubormoqchisiz?",
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )
        return CHOOSING_ACTION

    async def send_ad_to_all_users(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Send text advertisement to all users"""
        query = update.callback_query
        
        await query.edit_message_text(
            "📢 *Matn reklama yuborish*\n\n"
            "Reklama matnini yuboring:\n"
            "(Bekor qilish uchun /cancel yozing)",
            parse_mode=ParseMode.MARKDOWN
        )
        return ENTERING_CHANNEL_ID

    async def send_photo_ad_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Prompt for photo advertisement"""
        query = update.callback_query
        
        await query.edit_message_text(
            "🖼️ *Rasm bilan reklama*\n\n"
            "Avval rasmni yuboring, keyin matnni yozing:\n"
            "(Bekor qilish uchun /cancel yozing)",
            parse_mode=ParseMode.MARKDOWN
        )
        return ENTERING_PHOTO

    async def send_video_ad_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Prompt for video advertisement"""
        query = update.callback_query
        
        await query.edit_message_text(
            "🎥 *Video bilan reklama*\n\n"
            "Avval videoni yuboring, keyin matnni yozing:\n"
            "(Bekor qilish uchun /cancel yozing)",
            parse_mode=ParseMode.MARKDOWN
        )
        return ENTERING_VIDEO

    async def send_ad_to_active_users(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Send advertisement to active users only"""
        query = update.callback_query
        
        await query.edit_message_text(
            "🎯 *Faol foydalanuvchilarga reklama*\n\n"
            "Reklama matnini yuboring:\n"
            "(Bekor qilish uchun /cancel yozing)",
            parse_mode=ParseMode.MARKDOWN
        )
        return ENTERING_CHANNEL_ID

    async def send_ad_to_channels(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Send advertisement to channels"""
        query = update.callback_query
        
        if not self.channels_data:
            await query.edit_message_text(
                "❌ Hech qanday kanal qo'shilmagan!\n\n"
                "Avval kanallar bo'limida kanal qo'shing.",
                parse_mode=ParseMode.MARKDOWN
            )
            return CHOOSING_ACTION
        
        await query.edit_message_text(
            "📺 *Kanallarga reklama*\n\n"
            "Reklama matnini yuboring:\n"
            "(Bekor qilish uchun /cancel yozing)",
            parse_mode=ParseMode.MARKDOWN
        )
        return ENTERING_CHANNEL_ID

    async def show_channels_management(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show channels management menu"""
        query = update.callback_query
        
        total_channels = len(self.channels_data)
        
        keyboard = [
            [InlineKeyboardButton("➕ Kanal qo'shish", callback_data="add_channel")],
            [InlineKeyboardButton("📋 Kanallar ro'yxati", callback_data="list_channels")],
            [InlineKeyboardButton("🗑️ Kanalni o'chirish", callback_data="delete_channel")],
            [InlineKeyboardButton("⬅️ Orqaga", callback_data="back_to_main")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            f"📺 *Kanal boshqaruvi*\n\n"
            f"📊 Jami kanallar: {total_channels}\n\n"
            f"Qaysi amalni bajarishni xohlaysiz?",
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )

    async def add_channel_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Prompt for adding channel"""
        query = update.callback_query
        
        # Set flag to indicate we're waiting for channel input
        context.user_data['waiting_for_channel'] = True
        
        keyboard = [
            [InlineKeyboardButton("⬅️ Orqaga", callback_data="channels")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            "➕ Kanal qo'shish\n\n"
            "Kanal linkini yoki ID'sini yuboring:\n"
            "Masalan: @channel_name yoki -1001234567890\n\n"
            "Bot kanalda admin bo'lishi kerak!",
            reply_markup=reply_markup
        )

    async def add_channel(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Add a new channel"""
        logger.info("add_channel function called")
        channel_input = update.message.text
        logger.info(f"Channel input: {channel_input}")
        
        if channel_input == "/cancel":
            context.user_data.pop('waiting_for_channel', None)
            await update.message.reply_text("❌ Kanal qo'shish bekor qilindi")
            return
        
        try:
            logger.info("Trying to get channel info...")
            # Try to get channel info
            if channel_input.startswith('@'):
                # Username format
                logger.info(f"Getting chat by username: {channel_input}")
                channel_info = await context.bot.get_chat(channel_input)
            elif channel_input.startswith('-100'):
                # Channel ID format
                logger.info(f"Getting chat by ID: {channel_input}")
                channel_info = await context.bot.get_chat(int(channel_input))
            else:
                # Try as username without @
                logger.info(f"Getting chat by username with @: @{channel_input}")
                channel_info = await context.bot.get_chat(f"@{channel_input}")
            
            logger.info(f"Channel info received: {channel_info.title} ({channel_info.id})")
            
            # Check if bot is admin in the channel
            logger.info("Checking bot admin status...")
            bot_member = await context.bot.get_chat_member(channel_info.id, context.bot.id)
            logger.info(f"Bot member status: {bot_member.status}")
            
            if bot_member.status not in ['administrator', 'creator']:
                await update.message.reply_text(
                    "❌ Bot kanalda admin emas!\n\n"
                    "Bot'ni kanalga admin qilib qo'ying va qayta urinib ko'ring."
                )
                return
            
            # Add channel to database
            channel_id = str(channel_info.id)
            self.channels_data[channel_id] = {
                "id": channel_id,
                "username": channel_info.username or "N/A",
                "title": channel_info.title,
                "added_at": datetime.now().timestamp(),
                "added_by": update.effective_user.id
            }
            self.save_data(CHANNELS_FILE, self.channels_data)
            logger.info(f"Channel saved to database: {channel_id}")
            
            # Clear the waiting flag
            context.user_data.pop('waiting_for_channel', None)
            
            await update.message.reply_text(
                f"✅ Kanal muvaffaqiyatli qo'shildi!\n\n"
                f"📺 Nomi: {channel_info.title}\n"
                f"🔗 Username: @{channel_info.username or 'N/A'}\n"
                f"🆔 ID: {channel_id}"
            )
            
        except Exception as e:
            logger.error(f"Error adding channel: {e}")
            logger.error(f"Error type: {type(e)}")
            await update.message.reply_text(
                "❌ Kanal qo'shishda xatolik!\n\n"
                "Tekshiring:\n"
                "• Kanal linki to'g'ri\n"
                "• Bot kanalda admin\n"
                "• Kanal oshkor (private emas)\n\n"
                f"Xatolik: {str(e)}"
            )

    async def list_all_channels(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """List all channels"""
        query = update.callback_query
        
        if not self.channels_data:
            keyboard = [
                [InlineKeyboardButton("⬅️ Orqaga", callback_data="channels")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await query.edit_message_text(
                "📋 *Kanallar ro'yxati*\n\n"
                "Hali hech qanday kanal qo'shilmagan.",
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
            return
        
        channels_list = []
        for channel_id, channel_data in self.channels_data.items():
            title = channel_data.get('title', 'N/A')
            username = channel_data.get('username', 'N/A')
            added_date = datetime.fromtimestamp(channel_data.get('added_at', 0)).strftime('%Y-%m-%d')
            
            channels_list.append(f"📺 *{title}*\n🔗 @{username}\n📅 {added_date}\n")
        
        keyboard = [
            [InlineKeyboardButton("⬅️ Orqaga", callback_data="channels")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            f"📋 *Kanallar ro'yxati*\n\n" + "\n".join(channels_list),
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )

    async def delete_channel_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Prompt for deleting channel"""
        query = update.callback_query
        
        if not self.channels_data:
            keyboard = [
                [InlineKeyboardButton("⬅️ Orqaga", callback_data="channels")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await query.edit_message_text(
                "🗑️ *Kanalni o'chirish*\n\n"
                "Hali hech qanday kanal qo'shilmagan.",
                reply_markup=reply_markup,
                parse_mode=ParseMode.MARKDOWN
            )
            return
        
        # Create keyboard with channel options
        keyboard = []
        for channel_id, channel_data in self.channels_data.items():
            title = channel_data.get('title', 'N/A')
            keyboard.append([InlineKeyboardButton(f"🗑️ {title}", callback_data=f"del_channel_{channel_id}")])
        
        keyboard.append([InlineKeyboardButton("⬅️ Orqaga", callback_data="channels")])
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            "🗑️ *Kanalni o'chirish*\n\n"
            "O'chirish kerak bo'lgan kanalni tanlang:",
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )

    async def delete_channel(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Delete a specific channel"""
        query = update.callback_query
        channel_id = query.data.replace("del_channel_", "")
        
        if channel_id in self.channels_data:
            channel_title = self.channels_data[channel_id].get('title', 'N/A')
            del self.channels_data[channel_id]
            self.save_data(CHANNELS_FILE, self.channels_data)
            
            await query.edit_message_text(
                f"✅ Kanal o'chirildi!\n\n"
                f"📺 Nomi: {channel_title}\n"
                f"🆔 ID: {channel_id}"
            )
        else:
            await query.edit_message_text("❌ Kanal topilmadi!")

    def add_user(self, user_id, user_data):
        """Add or update user data"""
        if str(user_id) not in self.users_data:
            self.users_data[str(user_id)] = {
                "id": user_id,
                "username": user_data.get("username", ""),
                "first_name": user_data.get("first_name", ""),
                "last_name": user_data.get("last_name", ""),
                "created_at": datetime.now().timestamp(),
                "last_activity": datetime.now().timestamp(),
                "is_blocked": False
            }
        else:
            self.users_data[str(user_id)]["last_activity"] = datetime.now().timestamp()
        
        self.save_data(USERS_FILE, self.users_data)

    async def handle_photo_ad(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle photo advertisement with text"""
        # Store photo in context
        photo_id = update.message.photo[-1].file_id
        context.user_data['ad_photo'] = photo_id
        logger.info(f"Stored photo ID: {photo_id}")
        
        await update.message.reply_text(
            "📝 Endi reklama matnini yuboring:\n"
            "(Bekor qilish uchun /cancel yozing)"
        )
        return ENTERING_PHOTO

    async def handle_video_ad(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle video advertisement with text"""
        # Store video in context
        video_id = update.message.video.file_id
        context.user_data['ad_video'] = video_id
        logger.info(f"Stored video ID: {video_id}")
        
        await update.message.reply_text(
            "📝 Endi reklama matnini yuboring:\n"
            "(Bekor qilish uchun /cancel yozing)"
        )
        return ENTERING_VIDEO

    async def handle_photo_ad_text(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle text input for photo advertisement"""
        ad_text = update.message.text
        
        if ad_text == "/cancel":
            await update.message.reply_text("❌ Reklama bekor qilindi")
            return await self.admin_start(update, context)
        
        # Send photo with text to all users
        photo_id = context.user_data.get('ad_photo')
        logger.info(f"Photo ID: {photo_id}")
        logger.info(f"Total users: {len(self.users_data)}")
        
        if photo_id:
            sent_count = 0
            failed_count = 0
            
            for user_id, user_data in self.users_data.items():
                if user_data.get('is_blocked', False):
                    logger.info(f"Skipping blocked user: {user_id}")
                    continue
                    
                try:
                    logger.info(f"Sending photo to user: {user_id}")
                    await context.bot.send_photo(
                        chat_id=int(user_id),
                        photo=photo_id,
                        caption=ad_text,
                        parse_mode=ParseMode.MARKDOWN
                    )
                    sent_count += 1
                    logger.info(f"Successfully sent to user: {user_id}")
                except Exception as e:
                    failed_count += 1
                    logger.error(f"Failed to send photo ad to {user_id}: {e}")
            
            # Clear stored photo
            context.user_data.pop('ad_photo', None)
            
            await update.message.reply_text(
                f"✅ *Rasm bilan reklama yuborildi!*\n\n"
                f"📤 Yuborildi: {sent_count}\n"
                f"❌ Xatolik: {failed_count}",
                parse_mode=ParseMode.MARKDOWN
            )
        else:
            await update.message.reply_text("❌ Rasm topilmadi. Qaytadan urinib ko'ring.")
        
        return await self.admin_start(update, context)

    async def handle_video_ad_text(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle text input for video advertisement"""
        ad_text = update.message.text
        
        if ad_text == "/cancel":
            await update.message.reply_text("❌ Reklama bekor qilindi")
            return await self.admin_start(update, context)
        
        # Send video with text to all users
        video_id = context.user_data.get('ad_video')
        if video_id:
            sent_count = 0
            failed_count = 0
            
            for user_id, user_data in self.users_data.items():
                if user_data.get('is_blocked', False):
                    continue
                    
                try:
                    await context.bot.send_video(
                        chat_id=int(user_id),
                        video=video_id,
                        caption=ad_text,
                        parse_mode=ParseMode.MARKDOWN
                    )
                    sent_count += 1
                except Exception as e:
                    failed_count += 1
                    logger.error(f"Failed to send video ad to {user_id}: {e}")
            
            # Clear stored video
            context.user_data.pop('ad_video', None)
            
            await update.message.reply_text(
                f"✅ *Video bilan reklama yuborildi!*\n\n"
                f"📤 Yuborildi: {sent_count}\n"
                f"❌ Xatolik: {failed_count}",
                parse_mode=ParseMode.MARKDOWN
            )
        else:
            await update.message.reply_text("❌ Video topilmadi. Qaytadan urinib ko'ring.")
        
        return await self.admin_start(update, context)

    async def check_channel_subscription(self, user_id, context):
        """Check if user is subscribed to all required channels"""
        if not self.channels_data:
            return []  # No channels required
        
        not_subscribed = []
        for channel_id, channel_data in self.channels_data.items():
            try:
                member = await context.bot.get_chat_member(int(channel_id), user_id)
                if member.status in ['left', 'kicked']:
                    not_subscribed.append(channel_data)
            except Exception as e:
                logger.error(f"Error checking subscription for channel {channel_id}: {e}")
                not_subscribed.append(channel_data)
        
        return not_subscribed

    async def show_subscription_required(self, update: Update, context: ContextTypes.DEFAULT_TYPE, not_subscribed):
        """Show subscription required message with channel buttons"""
        message = "📢 *Obuna bo'lish talab qilinadi!*\n\n"
        message += "Bot'ni ishlatish uchun quyidagi kanallarga obuna bo'ling:\n\n"
        
        keyboard = []
        for channel in not_subscribed:
            channel_id = channel.get('id')
            title = channel.get('title', 'N/A')
            username = channel.get('username', 'N/A')
            
            if username != 'N/A':
                # Add channel link button
                keyboard.append([InlineKeyboardButton(f"📺 {title}", url=f"https://t.me/{username}")])
            else:
                # Add channel ID for private channels
                keyboard.append([InlineKeyboardButton(f"📺 {title}", url=f"https://t.me/c/{channel_id[4:]}/1")])
        
        keyboard.append([InlineKeyboardButton("✅ Obuna bo'ldim", callback_data="check_subscription")])
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            message,
            reply_markup=reply_markup,
            parse_mode=ParseMode.MARKDOWN
        )

    async def handle_subscription_check(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle subscription check"""
        query = update.callback_query
        await query.answer()
        
        user_id = update.effective_user.id
        
        # Check channel subscription
        not_subscribed = await self.check_channel_subscription(user_id, context)
        
        if not_subscribed:
            # User is not subscribed to some channels
            await self.show_subscription_required(update, context, not_subscribed)
        else:
            # User is subscribed to all channels, show main message
            await query.edit_message_text("✅ Obuna bo'ldingiz! Endi /start buyrug'ini yuboring.")

# Global admin panel instance
admin_panel = EnhancedAdminPanel()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a marketing message with inline button when /start is issued."""
    
    # Check channel subscription first
    not_subscribed = await admin_panel.check_channel_subscription(update.effective_user.id, context)
    
    if not_subscribed:
        # User is not subscribed to some channels
        await admin_panel.show_subscription_required(update, context, not_subscribed)
        return
    
    # Add user to database
    admin_panel.add_user(update.effective_user.id, {
        "username": update.effective_user.username,
        "first_name": update.effective_user.first_name,
        "last_name": update.effective_user.last_name
    })
    
    # Marketing message
    welcome_message = """
🚀 *Xush kelibsiz!*

📱 **Ish O'rinlari** - Telegram orqali ish toping va joylashtiring!

🎯 **Bu ilova nima qiladi:**
• 🔍 **Ish qidiring** - O'zingizga mos ishni toping
• ➕ **Ish joylashtiring** - O'z ishingizni e'lon qiling
• 👤 **Profil yarating** - O'zingiz haqingizda ma'lumot bering
• 💬 **Bog'laning** - Ish beruvchi yoki ishchi bilan aloqa qiling

💼 **Kim uchun:**
• 👨‍💼 **Ish izlovchilar** - Yangi ish toping
• 🏢 **Ish beruvchilar** - Xodim toping
• 👥 **Kompaniyalar** - O'z ishlaringizni tanishtiring

🔒 **Xavfsizlik:**
• Barcha ma'lumotlaringiz xavfsiz
• Faqat siz ko'ra olasiz
• Hech kim sizning ma'lumotlaringizni olmaydi

💎 **Bepul va oddiy:**
• Hech qanday to'lov yo'q
• Ro'yxatdan o'tish 1 daqiqa
• Hohlagancha ish qidiring
• Hohlagancha ish joylashtiring

🚀 **Boshlash uchun tugmani bosing!**
    """
    
    # Create inline keyboard with button to mini-app
    keyboard = [
        [InlineKeyboardButton("📱 Ilovani ochish", web_app={"url": MINI_APP_URL})]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        welcome_message,
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )

async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel any operation and return to main menu"""
    if update.message:
        await update.message.reply_text("❌ Amal bekor qilindi")
    else:
        await update.callback_query.edit_message_text("❌ Amal bekor qilindi")
    return ConversationHandler.END

async def simple_admin_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Simple admin start without conversation handler"""
    user_id = update.effective_user.id
    
    if not admin_panel.is_admin(user_id):
        await update.message.reply_text("❌ Siz admin emassiz!")
        return
        
    keyboard = [
        [InlineKeyboardButton("👥 Foydalanuvchilar", callback_data="users")],
        [InlineKeyboardButton("📊 Statistika", callback_data="stats")],
        [InlineKeyboardButton("📢 Reklama yuborish", callback_data="ads")],
        [InlineKeyboardButton("📺 Kanal boshqaruvi", callback_data="channels")],
        [InlineKeyboardButton("❌ Chiqish", callback_data="exit")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🔧 *Admin Panel*\n\nQaysi bo'limni ochmoqchisiz?",
        reply_markup=reply_markup,
        parse_mode=ParseMode.MARKDOWN
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming messages"""
    logger.info(f"Message received from user {update.effective_user.id}: {update.message.text}")
    logger.info(f"User data: {context.user_data}")
    
    # Check if user is admin and waiting for channel input
    if update.effective_user.id in ADMIN_IDS and context.user_data.get('waiting_for_channel'):
        logger.info("User is admin and waiting for channel input, calling add_channel")
        await admin_panel.add_channel(update, context)
        return
    else:
        logger.info("Message not handled by admin panel")

def main() -> None:
    """Start the bot."""
    # Create the Application
    application = Application.builder().token(BOT_TOKEN).build()

    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("admin", simple_admin_start))
    
    # Add message handler for channel addition
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Add callback query handler for admin panel buttons
    application.add_handler(CallbackQueryHandler(admin_panel.handle_admin_callback))

    # Run the bot until the user presses Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main() 