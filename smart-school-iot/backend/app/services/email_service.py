import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
import logging

logger = logging.getLogger("email_service")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "springvolmail@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "ortvpfstchewxynb").replace(" ", "")
SMTP_FROM = os.getenv("SMTP_FROM", "springvolmail@gmail.com")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "SmartSchoolIoT Portal")

def build_html_body(
    recipient_name: str,
    sender_name: str,
    sender_role: str,
    sender_school_name: str,
    subject: str,
    content: str,
    priority: str
) -> str:
    priority_badge_color = "#10b981" # Green
    if priority == "URGENT":
        priority_badge_color = "#ef4444" # Red
    elif priority == "NOTICE":
        priority_badge_color = "#f59e0b" # Amber

    school_info_row = ""
    if sender_school_name:
        school_info_row = f"""
        <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 120px;">Affiliation:</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 500;">{sender_school_name}</td>
        </tr>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
            .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 30px; text-align: left; border-bottom: 3px solid #0d9488; }}
            .header h1 {{ margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }}
            .header p {{ margin: 4px 0 0; color: #5eead4; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }}
            .content {{ padding: 30px; color: #334155; }}
            .greeting {{ font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }}
            .meta-box {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }}
            .badge {{ display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #ffffff; background-color: {priority_badge_color}; text-transform: uppercase; }}
            .message-body {{ background-color: #ffffff; border-left: 4px solid #0d9488; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0; background: #f0fdfa; }}
            .message-text {{ font-size: 15px; line-height: 1.6; color: #0f172a; white-space: pre-wrap; }}
            .footer {{ background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5; }}
            .btn {{ display: inline-block; padding: 10px 24px; background: #0d9488; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 8px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SmartSchoolIoT Notification</h1>
                <p>Govt. School Water & Mid-Day Meal Monitoring Portal</p>
            </div>
            <div class="content">
                <div class="greeting">Hello {recipient_name},</div>
                <p style="font-size: 14px; color: #475569; margin-top: 0;">
                    You have received an official communication via the SmartSchoolIoT System.
                </p>

                <div class="meta-box">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 120px;">From:</td>
                            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{sender_name} ({sender_role})</td>
                        </tr>
                        {school_info_row}
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Subject:</td>
                            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">{subject}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Priority:</td>
                            <td style="padding: 6px 0;"><span class="badge">{priority}</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Timestamp:</td>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">{datetime.utcnow().strftime('%d %b %Y, %I:%M %p UTC')}</td>
                        </tr>
                    </table>
                </div>

                <div style="font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Message Content:</div>
                <div class="message-body">
                    <div class="message-text">{content}</div>
                </div>

                <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
                    Please log in to your SmartSchoolIoT portal dashboard to view full communications and take any necessary action.
                </p>
            </div>
            <div class="footer">
                <p style="margin: 0 0 6px;">Department of School Education | Government Water Quality & Kitchen Monitoring Node</p>
                <p style="margin: 0; font-size: 11px;">This is an automated system dispatch sent via SmartSchoolIoT Mail Service.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html

def send_message_email(
    recipient_email: str,
    recipient_name: str,
    sender_name: str,
    sender_role: str,
    sender_school_name: str,
    subject: str,
    content: str,
    priority: str = "NORMAL"
) -> tuple[bool, str]:
    """
    Sends an email notification using SMTP.
    Returns (success: bool, detail: str)
    """
    if not recipient_email or "@" not in recipient_email:
        return False, f"Invalid recipient email address: '{recipient_email}'"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[SmartSchoolIoT] {subject}"
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM}>"
        msg["To"] = recipient_email

        # Plain-text fallback
        text_body = f"""SmartSchoolIoT Portal Notification
=========================================
Subject: {subject}
From: {sender_name} ({sender_role})
Affiliation: {sender_school_name or 'N/A'}
Priority: {priority}
Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

Message:
-----------------------------------------
{content}
-----------------------------------------
Please log in to your SmartSchoolIoT dashboard to respond or review.
"""
        html_body = build_html_body(
            recipient_name=recipient_name,
            sender_name=sender_name,
            sender_role=sender_role,
            sender_school_name=sender_school_name,
            subject=subject,
            content=content,
            priority=priority
        )

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        # Connect and send via Gmail SMTP
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_FROM, [recipient_email], msg.as_string())
        server.quit()

        return True, "Email notification delivered successfully."
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to send email to {recipient_email}: {error_msg}")
        return False, error_msg
