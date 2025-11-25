import * as React from "react";
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Text,
	Tailwind,
} from "@react-email/components";

interface EmailVerificationProps {
	username: string;
	userEmail: string;
	verificationUrl: string;
}

export const EmailVerification = (props: EmailVerificationProps) => {
	const { username, userEmail, verificationUrl } = props;

	return (
		<Html lang="en" dir="ltr">
			<Tailwind>
				<Head />
				<Preview>
					Verify your email address to complete your account setup
				</Preview>
				<Body className="bg-gray-100 font-sans py-[40px]">
					<Container className="mx-auto bg-white rounded-[8px] shadow-sm max-w-[600px]">
						{/* Header */}
						<Section className="bg-blue-600 text-white text-center py-[32px] rounded-t-[8px]">
							<Heading className="text-[28px] font-bold m-0">
								Verify Your Email
							</Heading>
						</Section>

						{/* Main Content */}
						<Section className="px-[48px] py-[40px]">
							<Text className="text-[16px] text-gray-700 leading-[24px] mb-[24px]">
								Hello, {username}
							</Text>

							<Text className="text-[16px] text-gray-700 leading-[24px] mb-[24px]">
								Thanks {username} for signing up! To complete your account setup
								and ensure the security of your account, please verify your
								email address by clicking the button below.
							</Text>

							<Text className="text-[14px] text-gray-600 leading-[20px] mb-[32px]">
								Email to verify: <strong>{userEmail}</strong>
							</Text>

							{/* Verification Button */}
							<Section className="text-center mb-[32px]">
								<Button
									href={verificationUrl}
									className="bg-blue-600 text-white font-semibold py-[16px] px-[32px] rounded-[8px] text-[16px] no-underline box-border hover:bg-blue-700"
								>
									Verify Email Address
								</Button>
							</Section>

							<Text className="text-[14px] text-gray-600 leading-[20px] mb-[24px]">
								If the button above doesn't work, you can also copy and paste
								the following link into your browser:
							</Text>

							<Text className="text-[14px] text-blue-600 break-all mb-[32px] p-[12px] bg-gray-50 rounded-[4px] border border-solid border-gray-200">
								{verificationUrl}
							</Text>

							<Text className="text-[14px] text-gray-600 leading-[20px] mb-[16px]">
								This verification link will expire in 24 hours for security
								reasons. If you didn't create an account with us, you can safely
								ignore this email.
							</Text>

							<Text className="text-[14px] text-gray-600 leading-[20px]">
								If you have any questions or need assistance, please don't
								hesitate to contact our support team.
							</Text>
						</Section>

						{/* Footer */}
						<Section className="bg-gray-50 px-[48px] py-[32px] rounded-b-[8px] border-t border-solid border-gray-200">
							<Text className="text-[12px] text-gray-500 leading-[16px] text-center m-0 mb-[8px]">
								This email was sent to {userEmail}
							</Text>
							<Text className="text-[12px] text-gray-500 leading-[16px] text-center m-0 mb-[16px]">
								© {new Date().getFullYear()} rently. All rights reserved.
							</Text>
							<Text className="text-[12px] text-gray-500 leading-[16px] text-center m-0">
								rently Inc. 123 Carmel Lane, Hendala, Wattala, Sri Lanka
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
