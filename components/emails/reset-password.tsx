import * as React from "react";
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Section,
	Text,
	Tailwind,
} from "@react-email/components";

interface ForgotPasswordEmailProps {
	username: string;
	userEmail: string;
	resetUrl: string;
}

export const ForgotPasswordEmail = (props: ForgotPasswordEmailProps) => {
	const { username, userEmail, resetUrl } = props;

	return (
		<Html lang="en" dir="ltr">
			<Tailwind>
				<Head />
				<Preview>Reset your password - Action required</Preview>
				<Body className="bg-gray-100 font-sans py-[40px]">
					<Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto p-[40px]">
						{/* Header */}
						<Section className="text-center mb-[32px]">
							<Heading className="text-[28px] font-bold text-gray-900 m-0 mb-[8px]">
								Password Reset Request
							</Heading>
							<Text className="text-[16px] text-gray-600 m-0">
								We received a request to reset your password
							</Text>
						</Section>

						{/* Main Content */}
						<Section className="mb-[32px]">
							<Text className="text-[16px] text-gray-800 leading-[24px] m-0 mb-[16px]">
								Hello, {username}
							</Text>
							<Text className="text-[16px] text-gray-800 leading-[24px] m-0 mb-[16px]">
								We received a request to reset the password for your account
								associated with <strong>{userEmail}</strong>.
							</Text>
							<Text className="text-[16px] text-gray-800 leading-[24px] m-0 mb-[24px]">
								Click the button below to create a new password:
							</Text>
						</Section>

						{/* Reset Button */}
						<Section className="text-center mb-[32px]">
							<Button
								href={resetUrl}
								className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border inline-block"
							>
								Reset Password
							</Button>
						</Section>

						{/* Alternative Link */}
						<Section className="mb-[32px]">
							<Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[16px]">
								If the button above doesn't work, copy and paste the following
								link into your browser:
							</Text>
							<Text className="text-[14px] text-blue-600 break-all m-0">
								<Link href={resetUrl} className="text-blue-600 underline">
									{resetUrl}
								</Link>
							</Text>
						</Section>

						{/* Security Notice */}
						<Section className="border-t border-gray-200 pt-[24px] mb-[24px]">
							<Heading className="text-[18px] font-semibold text-gray-900 m-0 mb-[12px]">
								Security Notice
							</Heading>
							<Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[12px]">
								• This password reset link will expire in 24 hours
							</Text>
							<Text className="text-[14px] text-gray-600 leading-[20px] m-0 mb-[12px]">
								• If you didn't request this reset, please ignore this email
							</Text>
							<Text className="text-[14px] text-gray-600 leading-[20px] m-0">
								• For security reasons, this link can only be used once
							</Text>
						</Section>

						{/* Support */}
						<Section className="mb-[32px]">
							<Text className="text-[14px] text-gray-600 leading-[20px] m-0">
								Need help? Contact our support team at{" "}
								<Link
									href="mailto:support@rently.com"
									className="text-blue-600 underline"
								>
									support@rently.com
								</Link>
							</Text>
						</Section>

						{/* Footer */}
						<Section className="border-t border-gray-200 pt-[24px]">
							<Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[8px]">
								Best regards,
								<br />
								The rently Team
							</Text>
							<Text className="text-[12px] text-gray-400 leading-[16px] m-0">
								rently Inc.
								<br />
								123 Carmel Lane, Hendala
								<br />
								Wattala, Sri Lanka
							</Text>
							<Text className="text-[12px] text-gray-400 leading-[16px] m-0 mt-[16px]">
								<Link href="#" className="text-gray-400 underline mr-[16px]">
									Unsubscribe
								</Link>
								© {new Date().getFullYear()} rently. All rights reserved.
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

